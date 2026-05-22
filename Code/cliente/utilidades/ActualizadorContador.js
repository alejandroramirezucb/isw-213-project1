class ActualizadorContador {
  constructor(carritoServicio) {
    this._carritoServicio = carritoServicio;
  }

  actualizar() {
    const cantidad = this._carritoServicio.obtenerCantidadTotal();
    const contador = document.querySelector('.barra-navegacion__contador-carrito');
    if (!contador) return;

    contador.textContent = cantidad;
    contador.classList.remove('barra-navegacion__contador-carrito--animado');
    void contador.offsetWidth;
    if (cantidad > 0) {
      contador.classList.add('barra-navegacion__contador-carrito--animado');
    }
  }
}

export default ActualizadorContador;
