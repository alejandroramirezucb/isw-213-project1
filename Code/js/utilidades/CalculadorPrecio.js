class CalculadorPrecio {
    static calcularCuotas(precio, numeroCuotas = 12) {
        return (precio / numeroCuotas).toFixed(2);
    }

    static formatearPrecio(precio) {
        return parseFloat(precio).toFixed(2);
    }

    static calcularSubtotal(precio, cantidad) {
        return (precio * cantidad).toFixed(2);
    }
}

