const UMBRAL_REPOSICION_DEFECTO = 5;

class GestorStock {
  static requiereReposicion(stock, umbral = UMBRAL_REPOSICION_DEFECTO) {
    return stock <= umbral;
  }
}

export default GestorStock;