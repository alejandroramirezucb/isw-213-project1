class ControladorPedidosAdmin {
  constructor(modeloPedido, vistaPedidosAdmin) {
    this._modelo = modeloPedido;
    this._vista = vistaPedidosAdmin;
    this._bindEventos();
    this._modelo.cargarAdmin();
  }

  _bindEventos() {
    document.addEventListener('pedido:avanceSolicitado', async (e) => {
      const { pedidoId, estado } = e.detail;
      try {
        await this._modelo.avanzarEstado(pedidoId, estado);
        if (window.showToast) window.showToast(`Estado actualizado: ${estado}`, { tipo: 'success' });
        await this._modelo.cargarAdmin();
      } catch (err) {
        if (window.showToast) window.showToast(err.message, { tipo: 'error' });
      }
    });

    document.addEventListener('pedido:retiroConfirmado', async (e) => {
      const { pedidoId } = e.detail;
      try {
        await this._modelo.avanzarEstado(pedidoId, 'entregado');
        if (window.showToast) window.showToast('Retiro confirmado. Pedido marcado como entregado.', { tipo: 'success' });
        this._vista.limpiarEntradaQR();
        await this._modelo.cargarAdmin();
      } catch (err) {
        if (window.showToast) window.showToast(err.message, { tipo: 'error' });
      }
    });
  }
}

export default ControladorPedidosAdmin;
