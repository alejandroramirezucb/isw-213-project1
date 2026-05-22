class ControladorRutasAdmin {
  constructor(vistaMonitoreoRutas, clienteSupabase) {
    this._vista = vistaMonitoreoRutas;
    this._supabase = clienteSupabase;
    this._bindEventos();
  }

  _bindEventos() {
    document.addEventListener('ruta:consultarSolicitada', async (e) => {
      const { choferId, fechaRuta } = e.detail;
      await this._consultarRuta(choferId, fechaRuta);
    });
  }

  async _consultarRuta(choferId, fechaRuta) {
    const { data: envios } = await this._supabase
      .from('envios')
      .select('id, pedido_id, fecha_asignacion')
      .eq('chofer_id', choferId);

    if (!envios || !envios.length) {
      if (window.showToast) window.showToast('Este chofer no tiene envíos registrados', { tipo: 'info' });
      document.getElementById('contenedor-mapa-ruta') && (document.getElementById('contenedor-mapa-ruta').style.display = 'none');
      document.getElementById('contenedor-entregas-chofer') && (document.getElementById('contenedor-entregas-chofer').style.display = 'none');
      return;
    }

    const envioIds = envios.map((e) => e.id);
    const pedidoIds = envios.map((e) => e.pedido_id);
    const fechaInicio = `${fechaRuta}T00:00:00`;
    const fechaFin = `${fechaRuta}T23:59:59`;

    const [resUbicaciones, resPedidos] = await Promise.all([
      this._supabase.from('historial_ubicaciones').select('envio_id, latitud, longitud, fecha_registro').in('envio_id', envioIds).gte('fecha_registro', fechaInicio).lte('fecha_registro', fechaFin).order('fecha_registro', { ascending: true }),
      this._supabase.from('pedidos').select('id, direccion_destino, estado, fecha_entrega_final, usuario_id').in('id', pedidoIds),
    ]);

    const ubicaciones = resUbicaciones.data || [];
    const pedidos = resPedidos.data || [];

    this._vista.renderizarMapa(ubicaciones);

    const mapaEnvios = Object.fromEntries(envios.map((e) => [e.pedido_id, e]));
    const usuarioIds = [...new Set(pedidos.map((p) => p.usuario_id))];
    const { data: usuarios } = await this._supabase.from('usuarios').select('id, nombre_completo').in('id', usuarioIds);
    const mapaUsuarios = Object.fromEntries((usuarios || []).map((u) => [u.id, u.nombre_completo]));

    this._vista.renderizarTablaEntregas(pedidos, mapaEnvios, mapaUsuarios, fechaRuta);
  }
}

export default ControladorRutasAdmin;
