class ChoferServicio {
  constructor(clienteSupabase) {
    this._supabase = clienteSupabase;
  }

  async enviarUbicacion(envioId, latitud, longitud) {
    await fetch('/api/envios/ubicacion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ envio_id: envioId, latitud, longitud }),
    });
  }

  async actualizarEvidencia(envioId, urlFoto) {
    const respuesta = await fetch(`/api/envios/${envioId}/evidencia`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ foto_evidencia_url: urlFoto }),
    });
    const json = await respuesta.json();
    if (!respuesta.ok || json.error) throw new Error(json.error || respuesta.statusText);
    return json;
  }

  async subirEvidencia(envioId, archivo) {
    const nombreArchivo = `evidencia_${envioId}_${Date.now()}.jpg`;
    const rutaArchivo = `evidencias/${nombreArchivo}`;

    const { error } = await this._supabase.storage
      .from('evidencias-entrega')
      .upload(rutaArchivo, archivo, { contentType: archivo.type });

    if (error) {
      return `evidencia_local_${envioId}_${Date.now()}`;
    }

    const { data } = this._supabase.storage
      .from('evidencias-entrega')
      .getPublicUrl(rutaArchivo);

    return data.publicUrl;
  }

  async obtenerEntregasPorChofer(choferId, estados) {
    const { data: envios, error: errorEnvios } = await this._supabase
      .from('envios')
      .select('id, pedido_id, fecha_asignacion, latitud_destino, longitud_destino, foto_evidencia_url')
      .eq('chofer_id', choferId);

    if (errorEnvios || !envios || envios.length === 0) return { pedidos: [], mapaEnvios: {} };

    const pedidoIds = envios.map((e) => e.pedido_id);

    let query = this._supabase
      .from('pedidos')
      .select('id, monto_total, estado, direccion_destino, fecha_creacion, fecha_entrega_final, usuario_id')
      .in('id', pedidoIds)
      .order('fecha_creacion', { ascending: true });

    if (estados) {
      if (Array.isArray(estados)) {
        query = query.in('estado', estados);
      } else {
        query = query.eq('estado', estados);
      }
    }

    const { data: pedidos } = await query;
    if (!pedidos || pedidos.length === 0) return { pedidos: [], mapaEnvios: {} };

    const usuarioIds = [...new Set(pedidos.map((p) => p.usuario_id))];
    const { data: usuarios } = await this._supabase
      .from('usuarios')
      .select('id, nombre_completo')
      .in('id', usuarioIds);

    const mapaUsuarios = Object.fromEntries((usuarios || []).map((u) => [u.id, u.nombre_completo]));
    const mapaEnvios = Object.fromEntries(envios.map((e) => [e.pedido_id, e]));

    return {
      pedidos: pedidos.map((p) => ({ ...p, nombre_cliente: mapaUsuarios[p.usuario_id] || 'Desconocido' })),
      mapaEnvios,
    };
  }
}

export default ChoferServicio;
