class ModeloAuth {
  constructor(authServicio) {
    this._servicio = authServicio;
  }

  async iniciarSesion(correo, contrasena) {
    try {
      const data = await this._servicio.iniciarSesion(correo, contrasena);
      document.dispatchEvent(new CustomEvent('auth:sesionIniciada', {
        detail: { usuario: data.user, sesion: data.session },
      }));
    } catch (error) {
      document.dispatchEvent(new CustomEvent('auth:sesionError', {
        detail: { mensaje: error.message },
      }));
    }
  }

  async registrar({ nombre, correo, contrasena, telefono, rol }) {
    try {
      const data = await this._servicio.registrar(correo, contrasena, nombre, rol || 'cliente');
      await this._servicio.guardarUsuario(data.user, nombre, rol || 'cliente', telefono);
      document.dispatchEvent(new CustomEvent('auth:sesionIniciada', {
        detail: { usuario: data.user, sesion: data.session },
      }));
    } catch (error) {
      document.dispatchEvent(new CustomEvent('auth:sesionError', {
        detail: { mensaje: error.message },
      }));
    }
  }
}

export default ModeloAuth;
