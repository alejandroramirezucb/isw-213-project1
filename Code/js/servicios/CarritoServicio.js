class CarritoServicio {
    constructor() {
        this.claveLocalStorage = 'carrito';
    }

    obtenerCarrito() {
        return JSON.parse(localStorage.getItem(this.claveLocalStorage)) || [];
    }

    guardarCarrito(carrito) {
        localStorage.setItem(this.claveLocalStorage, JSON.stringify(carrito));
    }

    agregarProducto(producto, cantidad = 1) {
        const carrito = this.obtenerCarrito();
        const indice = carrito.findIndex(item => item.id === producto.id);

        if (indice !== -1) {
            carrito[indice].cantidad += cantidad;
        } else {
            carrito.push({ ...producto, cantidad });
        }

        this.guardarCarrito(carrito);
        return carrito;
    }

    actualizarCantidad(indiceProducto, nuevaCantidad) {
        const carrito = this.obtenerCarrito();
        
        if (indiceProducto >= 0 && indiceProducto < carrito.length) {
            carrito[indiceProducto].cantidad = nuevaCantidad;
            this.guardarCarrito(carrito);
        }
        
        return carrito;
    }

    eliminarProducto(indiceProducto) {
        const carrito = this.obtenerCarrito();
        carrito.splice(indiceProducto, 1);
        this.guardarCarrito(carrito);
        return carrito;
    }

    obtenerCantidadTotal() {
        const carrito = this.obtenerCarrito();
        return carrito.reduce((total, item) => total + (item.cantidad || 0), 0);
    }

    obtenerPrecioTotal() {
        const carrito = this.obtenerCarrito();
        return carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0);
    }

    limpiarCarrito() {
        localStorage.removeItem(this.claveLocalStorage);
    }
}

