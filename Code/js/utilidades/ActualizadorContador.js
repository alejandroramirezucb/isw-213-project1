class ActualizadorContador {
  constructor(carritoServicio) {
    this.carritoServicio = carritoServicio;
  }

  actualizar() {
    var cantidadTotal = this.carritoServicio.obtenerCantidadTotal();
    var contador = document.querySelector(
      '.barra-navegacion__contador-carrito',
    );

    if (!contador) return;

    var valorAnterior = parseInt(contador.textContent) || 0;
    contador.textContent = cantidadTotal;
    contador.style.display = cantidadTotal > 0 ? 'inline-flex' : 'none';

    if (cantidadTotal !== valorAnterior) {
      contador.classList.remove('insignia-animada');
      void contador.offsetWidth;
      contador.classList.add('insignia-animada');
      setTimeout(function () {
        contador.classList.remove('insignia-animada');
      }, 500);
    }
  }
}
