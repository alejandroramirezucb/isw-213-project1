class ControladorHistorial {
  constructor(modeloPedido, devolucionServicio, clienteSupabase) {
    this._modeloPedido = modeloPedido;
    this._devolucionServicio = devolucionServicio;
    this._supabase = clienteSupabase;
    this._usuarioId = null;
    this._inicializar();
    this._bindEventos();
  }

  async _inicializar() {
    if (!this._supabase) { window.location.href = '/login'; return; }

    const { data } = await this._supabase.auth.getSession();
    if (!data.session) { window.location.href = '/login'; return; }

    this._usuarioId = data.session.user.id;
    await this._modeloPedido.cargarHistorialUsuario(this._supabase, this._usuarioId);
    this._suscribirRealtime();
  }

  _suscribirRealtime() {
    this._supabase
      .channel(`mis-pedidos-${this._usuarioId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `usuario_id=eq.${this._usuarioId}` }, async (payload) => {
        const pedido = payload.new;
        if (pedido.estado === 'listo para entregarse') {
          if (window.showToast) window.showToast(`¡Tu pedido #${pedido.id} está listo para entregarse!`, { tipo: 'success', duracion: 8000 });
        }
        await this._modeloPedido.cargarHistorialUsuario(this._supabase, this._usuarioId);
      })
      .subscribe();
  }

  _bindEventos() {
    document.addEventListener('pedido:recepcionSolicitada', async (e) => {
      try {
        const res = await fetch(`/api/pedidos/${e.detail.pedidoId}/confirmar-recepcion`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        if (window.showToast) window.showToast('Pedido confirmado y cerrado exitosamente', { tipo: 'success', duracion: 5000 });
        await this._modeloPedido.cargarHistorialUsuario(this._supabase, this._usuarioId);
      } catch {
        if (window.showToast) window.showToast('Error al confirmar recepción', { tipo: 'error' });
      }
    });

    document.addEventListener('pedido:retiroSolicitado', async (e) => {
      try {
        const res = await fetch(`/api/pedidos/${e.detail.pedidoId}/estado`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado: 'entregado' }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        if (window.showToast) window.showToast('Retiro confirmado. Ahora confirma la recepción para cerrar el pedido.', { tipo: 'success', duracion: 6000 });
        await this._modeloPedido.cargarHistorialUsuario(this._supabase, this._usuarioId);
      } catch {
        if (window.showToast) window.showToast('Error al procesar el retiro', { tipo: 'error' });
      }
    });

    document.addEventListener('devolucion:solicitada', async (e) => {
      const { pedidoId, motivo, archivo } = e.detail;
      try {
        const fotoUrl = await this._devolucionServicio.subirFotoDevolucion(pedidoId, archivo);
        await this._devolucionServicio.enviarSolicitud(pedidoId, motivo, fotoUrl);
        document.getElementById('modal-devolucion')?.classList.remove('modal-devolucion--visible');
        if (window.showToast) window.showToast('Solicitud de devolucion enviada correctamente', { tipo: 'success', duracion: 5000 });
        await this._modeloPedido.cargarHistorialUsuario(this._supabase, this._usuarioId);
      } catch {
        if (window.showToast) window.showToast('Error al procesar la solicitud de devolucion', { tipo: 'error' });
      }
    });
  }
}

export default ControladorHistorial;
