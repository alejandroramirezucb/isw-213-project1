class ModeloDevolucion {
  constructor(devolucionServicio) {
    this._servicio = devolucionServicio;
  }

  async cargar() {
    const devoluciones = await this._servicio.obtenerDevoluciones();
    document.dispatchEvent(new CustomEvent('devolucion:listaCargada', {
      detail: { devoluciones },
    }));
  }

  async procesar(devolucionId, accion, observaciones) {
    await this._servicio.procesar(devolucionId, accion, observaciones);
    document.dispatchEvent(new CustomEvent('devolucion:procesada', {
      detail: { devolucionId, accion },
    }));
    await this.cargar();
  }
}

export default ModeloDevolucion;
