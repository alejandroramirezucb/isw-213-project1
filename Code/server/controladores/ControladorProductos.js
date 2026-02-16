class ControladorProductos {
    constructor(servicioProductos) {
        this.servicioProductos = servicioProductos;
    }

    async obtenerTodos(peticion, respuesta) {
        try {
            const filtros = {
                busqueda: peticion.query.q,
                categoria: peticion.query.categoria,
                precioMinimo: peticion.query.minPrice,
                precioMaximo: peticion.query.maxPrice,
                soloDisponibles: peticion.query.inStock
            };

            const productos = await this.servicioProductos.obtenerProductos(filtros);
            respuesta.json(productos);
        } catch (error) {
            console.error('Error al obtener productos:', error);
            respuesta.status(500).json({ 
                error: 'Error al obtener productos', 
                detalles: error.message 
            });
        }
    }

    async obtenerPorId(peticion, respuesta) {
        try {
            const { id } = peticion.params;
            const producto = await this.servicioProductos.obtenerProductoPorId(id);
            respuesta.json(producto);
        } catch (error) {
            console.error('Error al obtener producto:', error);
            respuesta.status(500).json({ error: 'Error al obtener el producto' });
        }
    }

    async verificarStock(peticion, respuesta) {
        try {
            const { id } = peticion.params;
            const infoStock = await this.servicioProductos.verificarStock(id);
            respuesta.json(infoStock);
        } catch (error) {
            console.error('Error al verificar stock:', error);
            
            if (error.message === 'Producto no encontrado')
                respuesta.status(404).json({ error: 'Producto no encontrado' });
            else
                respuesta.status(500).json({ error: 'Error al verificar stock' });
        }
    }
}

module.exports = ControladorProductos;

