class ServicioProductos {
  constructor(repositorioProductos, mapeadorProducto) {
    this.repositorioProductos = repositorioProductos;
    this.mapeadorProducto = mapeadorProducto;
  }

  async obtenerProductos(filtros) {
    if (filtros.categoria) {
      const nombreCategoria = filtros.categoria.split('-').join(' ');
      const productos = await this.repositorioProductos.obtenerPorCategoria(
        nombreCategoria,
        filtros,
      );
      return productos.map((producto) =>
        this.mapeadorProducto.mapear(producto),
      );
    }

    const productos = await this.repositorioProductos.obtenerTodos(filtros);
    return productos.map((producto) => this.mapeadorProducto.mapear(producto));
  }

  async obtenerProductoPorId(idProducto) {
    const producto = await this.repositorioProductos.obtenerPorId(idProducto);
    return this.mapeadorProducto.mapear(producto);
  }

  async verificarStock(idProducto) {
    const producto = await this.repositorioProductos.obtenerStock(idProducto);
    if (!producto) throw new Error('Producto no encontrado');

    return {
      id: producto.id,
      nombre: producto.nombre,
      stock: producto.stock_disponible,
      disponible: producto.stock_disponible > 0,
    };
  }
}

module.exports = ServicioProductos;
