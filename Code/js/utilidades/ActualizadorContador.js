class ActualizadorContador {
    constructor(carritoServicio) {
        this.carritoServicio = carritoServicio;
    }

    actualizar() {
        const cantidadTotal = this.carritoServicio.obtenerCantidadTotal();
        const contador = document.querySelector('.cart-count');
        
        if (contador) {
            contador.textContent = cantidadTotal;
            contador.style.display = cantidadTotal > 0 ? 'inline-block' : 'none';
        }
    }
}

