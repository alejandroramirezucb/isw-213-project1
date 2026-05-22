class ControladorDevolucionAdmin {
  constructor(modeloDevolucion) {
    this._modelo = modeloDevolucion;
    this._bindEventos();
    this._modelo.cargar();
  }

  _bindEventos() {
    document.addEventListener('devolucion:accionConfirmada', async (e) => {
      const { devolucionId, accion, observaciones } = e.detail;
      try {
        await this._modelo.procesar(devolucionId, accion, observaciones);
        const mensajeExito = accion === 'aprobar' ? 'Devolución aprobada correctamente' : 'Devolución rechazada correctamente';
        if (window.showToast) window.showToast(mensajeExito, { tipo: 'success' });
        document.getElementById('modal-observaciones-devolucion')?.classList.remove('panel-admin__modal-overlay--visible');
      } catch (err) {
        if (window.showToast) window.showToast(err.message, { tipo: 'error' });
      }
    });
  }
}

export default ControladorDevolucionAdmin;
