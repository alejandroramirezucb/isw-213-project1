class ControladorChofer {
  constructor(modeloChofer, choferServicio, pedidoServicio, authServicio, clienteSupabase) {
    this._modeloChofer = modeloChofer;
    this._choferServicio = choferServicio;
    this._pedidoServicio = pedidoServicio;
    this._authServicio = authServicio;
    this._supabase = clienteSupabase;
    this._choferId = null;
    this._intervaloGPS = null;
    this._envioEnCursoId = null;
    this._inicializar();
  }

  async _inicializar() {
    if (!this._supabase) { window.location.href = '/login'; return; }

    const sesion = await this._authServicio.obtenerSesion();
    if (!sesion) { window.location.href = '/login'; return; }

    const esChofer = await this._authServicio.verificarRol(sesion.user.id, 'chofer');
    if (!esChofer) { window.location.href = '/'; return; }

    this._choferId = sesion.user.id;
    this._bindEventos();
    await this._cargarTodo();
  }

  async _cargarTodo() {
    await Promise.all([
      this._modeloChofer.cargarPendientes(this._choferId),
      this._modeloChofer.cargarEnCurso(this._choferId),
      this._modeloChofer.cargarCompletadas(this._choferId),
    ]);
  }

  _bindEventos() {
    document.addEventListener('entrega:iniciarSolicitada', async (e) => {
      const { pedidoId, envioId } = e.detail;
      try {
        await this._pedidoServicio.avanzarEstado(pedidoId, 'trasladandose');
        if (window.showToast) window.showToast('Entrega iniciada - GPS activado', { tipo: 'success' });
        this._iniciarGPS(envioId);
        await Promise.all([
          this._modeloChofer.cargarPendientes(this._choferId),
          this._modeloChofer.cargarEnCurso(this._choferId),
        ]);
      } catch (err) {
        if (window.showToast) window.showToast(`Error al iniciar entrega: ${err.message}`, { tipo: 'error' });
      }
    });

    document.addEventListener('entrega:llegadaSolicitada', async (e) => {
      const { pedidoId } = e.detail;
      try {
        await this._pedidoServicio.avanzarEstado(pedidoId, 'listo para entregarse');
        if (window.showToast) window.showToast('Pedido listo para entregarse - Cliente notificado', { tipo: 'success', duracion: 5000 });
        await this._modeloChofer.cargarEnCurso(this._choferId);
      } catch (err) {
        if (window.showToast) window.showToast(`Error: ${err.message}`, { tipo: 'error' });
      }
    });

    document.addEventListener('evidencia:enviada', async (e) => {
      const { pedidoId, envioId, archivo } = e.detail;
      try {
        const urlFoto = await this._choferServicio.subirEvidencia(envioId, archivo);
        await Promise.all([
          this._choferServicio.actualizarEvidencia(envioId, urlFoto),
          this._pedidoServicio.avanzarEstado(pedidoId, 'entregado'),
        ]);
        this._enviarUbicacionFinal(envioId);
        this._detenerGPS();
        document.getElementById('modal-evidencia')?.classList.remove('panel-chofer__modal-overlay--visible');
        if (window.showToast) window.showToast('Entrega confirmada con evidencia', { tipo: 'success', duracion: 5000 });
        await Promise.all([
          this._modeloChofer.cargarEnCurso(this._choferId),
          this._modeloChofer.cargarCompletadas(this._choferId),
        ]);
      } catch {
        if (window.showToast) window.showToast('Error al registrar evidencia', { tipo: 'error' });
      }
    });
  }

  _iniciarGPS(envioId) {
    this._detenerGPS();
    this._envioEnCursoId = envioId;
    this._enviarUbicacion(envioId);
    this._intervaloGPS = setInterval(() => this._enviarUbicacion(envioId), 30000);
  }

  _detenerGPS() {
    if (this._intervaloGPS) { clearInterval(this._intervaloGPS); this._intervaloGPS = null; }
    this._envioEnCursoId = null;
  }

  _enviarUbicacion(envioId) {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => this._choferServicio.enviarUbicacion(envioId, pos.coords.latitude, pos.coords.longitude),
      () => {},
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  _enviarUbicacionFinal(envioId) {
    this._enviarUbicacion(envioId);
  }
}

export default ControladorChofer;
