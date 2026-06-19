class GestorDevoluciones {
  static puedeSolicitar(fechaEntrega, ahora) {
    const transcurridoMs = ahora - fechaEntrega;
    return transcurridoMs < 24 * 60 * 60 * 1000;
  }
}

export default GestorDevoluciones;
