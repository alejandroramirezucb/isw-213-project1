class ControladorAuth {
  constructor(modeloAuth) {
    this._modelo = modeloAuth;
    this._bindEventos();
  }

  _bindEventos() {
    document.addEventListener('auth:loginEnviado', (e) => {
      this._modelo.iniciarSesion(e.detail.correo, e.detail.contrasena);
    });

    document.addEventListener('auth:registroEnviado', (e) => {
      this._modelo.registrar(e.detail);
    });

    document.addEventListener('auth:sesionIniciada', () => {
      if (window.showToast) window.showToast('Sesión iniciada correctamente', { tipo: 'success' });
      setTimeout(() => { window.location.href = '/'; }, 1000);
    });

    document.addEventListener('auth:sesionError', (e) => {
      if (window.showToast) window.showToast(e.detail.mensaje, { tipo: 'error' });
    });
  }
}

export default ControladorAuth;
