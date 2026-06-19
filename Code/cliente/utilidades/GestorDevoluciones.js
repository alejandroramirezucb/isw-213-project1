const SEGUNDO_MS = 1000;
const MINUTO_MS = 60 * SEGUNDO_MS;
const HORA_MS = 60 * MINUTO_MS;
const LIMITE_DEVOLUCION_MS = 24 * HORA_MS;

class GestorDevoluciones {
  static puedeSolicitar(fechaEntrega, ahora) {
    return (ahora - fechaEntrega) < LIMITE_DEVOLUCION_MS;
  }
}

export default GestorDevoluciones;