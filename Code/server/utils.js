function mapearProducto(producto) {
    return {
        id: producto.id || producto.id_producto,
        name: producto.nombre || producto.nombre_producto,
        description: producto.descripcion || producto.descripcion_producto,
        price: producto.precio_actual,
        stock: producto.stock_disponible,
        images: producto.url_imagen ? [producto.url_imagen] : [],
        category: producto.categorias ? (producto.categorias.nombre || producto.categorias) : (producto.categoria_nombre || ''),
        brand: producto.marca || '',
        status: producto.estado || 'activo'
    };
}

function manejarError(error, respuesta, mensaje = 'Error en la operación') {
    console.error(mensaje + ':', error);
    respuesta.status(500).json({ 
        error: mensaje,
        detalles: error.message 
    });
}

function validarConfiguracion() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        console.error('ERROR: Variables de entorno no configuradas');
        console.error('Asegúrate de configurar SUPABASE_URL y SUPABASE_ANON_KEY en el archivo .env');
        return false;
    }
    return true;
}

module.exports = {
    mapearProducto,
    manejarError,
    validarConfiguracion
};
