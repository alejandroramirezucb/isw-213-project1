function mapearProducto(producto) {
  return {
    id: producto.id,
    nombre: producto.nombre,
    descripcion: producto.descripcion,
    precio: producto.precio_actual,
    stock: producto.stock_disponible,
    imagenes: producto.url_imagen ? [producto.url_imagen] : [],
    categoria: producto.categoria_nombre || '',
    estado: producto.estado || 'activo',
  };
}

function manejarError(error, respuesta, mensaje = 'Error en la operación') {
  respuesta.status(500).json({ error: mensaje, detalles: error.message });
}

function validarConfiguracion() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    return false;
  }
  return true;
}

module.exports = { mapearProducto, manejarError, validarConfiguracion };
