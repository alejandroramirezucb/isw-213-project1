class GestorStock {
  static requiereReposicion(stock, umbral = 5) {
    return stock <= umbral;
  }
}

export default GestorStock;
