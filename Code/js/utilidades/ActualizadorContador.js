class ActualizadorContador {
    constructor(carritoServicio) {
        this.carritoServicio = carritoServicio;
    }

    actualizar() {
        const cantidadTotal = this.carritoServicio.obtenerCantidadTotal();
        const contador = document.querySelector('.cart-count');
        if (contador) {
            const anterior = parseInt(contador.textContent) || 0;
            contador.textContent = cantidadTotal;
            contador.style.display = cantidadTotal > 0 ? 'inline-flex' : 'none';
            if (cantidadTotal !== anterior) {
                contador.classList.remove('badge-animado');
                void contador.offsetWidth;
                contador.classList.add('badge-animado');
                setTimeout(() => contador.classList.remove('badge-animado'), 500);
            }
        }
    }
}
