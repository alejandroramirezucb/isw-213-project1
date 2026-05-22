class CalculadorPrecio {
  static calcularCuotas(precio, numeroCuotas = 12) {
    return (precio / numeroCuotas).toFixed(2);
  }

  static formatearPrecio(precio) {
    return parseFloat(precio || 0).toFixed(2);
  }

  static calcularSubtotal(precio, cantidad) {
    return (parseFloat(precio || 0) * parseInt(cantidad || 0)).toFixed(2);
  }
}

export default CalculadorPrecio;
