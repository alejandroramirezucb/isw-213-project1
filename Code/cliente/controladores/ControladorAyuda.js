class ControladorAyuda {
  constructor(soporteServicio, vistaAyuda, clienteSupabase) {
    this._servicio = soporteServicio;
    this._vista = vistaAyuda;
    this._supabase = clienteSupabase;
    this._usuarioId = null;
    this._inicializar();
    this._bindEventos();
  }

  async _inicializar() {
    if (!this._supabase) return;

    const { data } = await this._supabase.auth.getSession();
    const sesion = data?.session;

    if (!sesion) {
      this._vista.mostrarConsultas(false);
      return;
    }

    this._usuarioId = sesion.user.id;
    this._vista.mostrarConsultas(true);

    const { data: userData } = await this._supabase.from('usuarios').select('nombre_completo').eq('id', sesion.user.id).single();
    this._vista.prefrellenarFormulario(sesion.user.email, userData?.nombre_completo);

    await this._cargarConsultas();
  }

  async _cargarConsultas() {
    if (!this._usuarioId) return;
    try {
      const consultas = await this._servicio.obtenerConsultasUsuario(this._supabase, this._usuarioId);
      this._vista.renderizarConsultas(consultas);
    } catch {
      this._vista.renderizarConsultas([]);
    }
  }

  _bindEventos() {
    document.addEventListener('ayuda:formularioEnviado', async (e) => {
      this._vista.bloquearBoton();
      try {
        await this._servicio.enviarMensaje({ ...e.detail, usuario_id: this._usuarioId });
        this._vista.resetearFormulario();
        if (window.showToast) window.showToast('¡Mensaje enviado! Te responderemos en menos de 24 horas.', { tipo: 'success', duracion: 6000 });
        await this._inicializar();
      } catch (err) {
        if (window.showToast) window.showToast('Error al enviar el mensaje. Inténtalo de nuevo.', { tipo: 'error' });
      } finally {
        this._vista.desbloquearBoton();
      }
    });
  }
}

export default ControladorAyuda;
