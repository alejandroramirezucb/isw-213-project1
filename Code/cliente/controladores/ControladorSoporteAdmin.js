class ControladorSoporteAdmin {
  constructor(modeloSoporte) {
    this._modelo = modeloSoporte;
    this._bindEventos();
    this._modelo.cargar();
  }

  _bindEventos() {
    document.addEventListener('soporte:respuestaEnviada', async (e) => {
      const { mensajeId, respuesta } = e.detail;
      try {
        await this._modelo.responder(mensajeId, respuesta);
        if (window.showToast) window.showToast('Respuesta enviada', { tipo: 'success' });
        document.getElementById('modal-respuesta-soporte')?.classList.remove('panel-admin__modal-overlay--visible');
      } catch (err) {
        if (window.showToast) window.showToast(err.message, { tipo: 'error' });
      }
    });
  }
}

export default ControladorSoporteAdmin;
