class ModeloSoporte {
  constructor(soporteServicio) {
    this._servicio = soporteServicio;
  }

  async cargar() {
    const mensajes = await this._servicio.obtenerMensajes();
    document.dispatchEvent(new CustomEvent('soporte:listaCargada', {
      detail: { mensajes },
    }));
  }

  async responder(id, respuesta) {
    await this._servicio.responderMensaje(id, respuesta);
    document.dispatchEvent(new CustomEvent('soporte:respondido', {
      detail: { mensajeId: id },
    }));
    await this.cargar();
  }
}

export default ModeloSoporte;
