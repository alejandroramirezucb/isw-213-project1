class ProductoServicio {
    constructor() {
        this.urlBase = '/api/productos';
    }

    async obtenerTodos(filtros = {}) {
        const parametros = new URLSearchParams();
        
        if (filtros.busqueda) parametros.append('q', filtros.busqueda);
        if (filtros.categoria) parametros.append('categoria', filtros.categoria);
        if (filtros.precioMinimo) parametros.append('minPrice', filtros.precioMinimo);
        if (filtros.precioMaximo) parametros.append('maxPrice', filtros.precioMaximo);
        if (filtros.soloDisponibles) parametros.append('inStock', filtros.soloDisponibles);

        const url = `${this.urlBase}${parametros.toString() ? '?' + parametros.toString() : ''}`;
        const respuesta = await fetch(url);
        
        if (!respuesta.ok) throw new Error('Error al obtener productos');
        
        return await respuesta.json();
    }

    async obtenerPorId(idProducto) {
        const respuesta = await fetch(`${this.urlBase}/${idProducto}`);
        
        if (!respuesta.ok) throw new Error('Producto no encontrado');
        
        return await respuesta.json();
    }

    async verificarStock(idProducto) {
        const respuesta = await fetch(`${this.urlBase}/${idProducto}/stock`);
        
        if (!respuesta.ok) throw new Error('Error al verificar stock');
        
        return await respuesta.json();
    }
}

