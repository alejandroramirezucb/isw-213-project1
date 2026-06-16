class CalculadorPrecio {
  static calcularCuotas(precio, numeroCuotas = 12) {
    return (precio / numeroCuotas).toFixed(2);
  }

  static calcularCuotaConInteres(precio, numeroCuotas, interes) {
    return CalculadorPrecio.calcularCuotas(
      precio * (1 + interes),
      numeroCuotas,
    );
  }

  static formatearPrecio(precio) {
    return parseFloat(precio || 0).toFixed(2);
  }

  static calcularSubtotal(precio, cantidad) {
    return (parseFloat(precio || 0) * parseInt(cantidad || 0)).toFixed(2);
  }

  static calcularTotalConEnvio(subtotal, metodoEntrega) {
    const envio = metodoEntrega === 'delivery' ? COSTO_DELIVERY : 0;
    return (parseFloat(subtotal || 0) + envio).toFixed(2);
  }
}

export default CalculadorPrecio;
