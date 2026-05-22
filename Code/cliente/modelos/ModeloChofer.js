class ModeloChofer {
  constructor(choferServicio) {
    this._servicio = choferServicio;
  }

  async cargarPendientes(choferId) {
    const { pedidos, mapaEnvios } = await this._servicio.obtenerEntregasPorChofer(
      choferId,
      'enviado',
    );
    document.dispatchEvent(new CustomEvent('entrega:listaCargada', {
      detail: { tipo: 'pendiente', pedidos, mapaEnvios },
    }));
  }

  async cargarEnCurso(choferId) {
    const { pedidos, mapaEnvios } = await this._servicio.obtenerEntregasPorChofer(
      choferId,
      ['trasladandose', 'listo para entregarse'],
    );
    document.dispatchEvent(new CustomEvent('entrega:listaCargada', {
      detail: { tipo: 'en-curso', pedidos, mapaEnvios },
    }));
  }

  async cargarCompletadas(choferId) {
    const { pedidos, mapaEnvios } = await this._servicio.obtenerEntregasPorChofer(
      choferId,
      'entregado',
    );
    document.dispatchEvent(new CustomEvent('entrega:listaCargada', {
      detail: { tipo: 'completada', pedidos, mapaEnvios },
    }));
  }
}

export default ModeloChofer;
