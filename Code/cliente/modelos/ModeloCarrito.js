const DURACION_TOAST_MS = 6000;

class ModeloCarrito {
  constructor(carritoServicio, productoServicio) {
    this._carritoServicio = carritoServicio;
    this._productoServicio = productoServicio;
    this._stockVerificado = false;
  }

  async obtener() {
    const carrito = this._carritoServicio.obtenerCarrito();
    if (!this._stockVerificado && carrito.length > 0) {
      const carritoActualizado = await this._verificarStock(carrito);
      this._stockVerificado = true;
      this._carritoServicio.guardarCarrito(carritoActualizado);
      this._emitirModificado(carritoActualizado);
      return;
    }
    this._emitirModificado(carrito);
  }

  agregar(producto, cantidad) {
    const resultado = this._carritoServicio.agregarProducto(producto, cantidad || 1);
    if (resultado.exito === false) {
      document.dispatchEvent(new CustomEvent('carrito:stockInsuficiente', {
        detail: { productoId: producto.id, stockDisponible: producto.stock },
      }));
      return;
    }
    this._emitirModificado(resultado.carrito);
  }

  eliminar(idProducto) {
    const carrito = this._carritoServicio.eliminarProducto(idProducto);
    this._emitirModificado(carrito);
  }

  actualizarCantidad(idProducto, cantidad) {
    const resultado = this._carritoServicio.actualizarCantidad(idProducto, cantidad);
    if (resultado.exito === false) {
      document.dispatchEvent(new CustomEvent('carrito:stockInsuficiente', {
        detail: { productoId: idProducto, stockDisponible: resultado.carrito.find(i => i.id === idProducto)?.stock },
      }));
      return;
    }
    const carrito = Array.isArray(resultado) ? resultado : resultado.carrito;
    this._emitirModificado(carrito);
  }

  vaciar() {
    this._carritoServicio.vaciarCarrito();
    this._emitirModificado([]);
  }

  async _verificarStock(carrito) {
    const promesas = carrito.map(async (item) => {
      try {
        const infoStock = await this._productoServicio.verificarStock(item.id);
        if (!infoStock.disponible || infoStock.stock === 0) {
          if (window.showToast) {
            window.showToast(`El producto "${item.nombre}" ya no está disponible y será eliminado del carrito.`, { tipo: 'warning', duracion: DURACION_TOAST_MS });
          }
          return null;
        }
        if (item.cantidad > infoStock.stock) {
          if (window.showToast) {
            window.showToast(`El producto "${item.nombre}" tiene menos stock. Se ajustó a ${infoStock.stock} unidades.`, { tipo: 'warning', duracion: DURACION_TOAST_MS });
          }
          item.cantidad = infoStock.stock;
        }
        item.stock = infoStock.stock;
        return item;
      } catch {
        return item;
      }
    });

    const resultados = await Promise.all(promesas);
    return resultados.filter((item) => item !== null);
  }

  _emitirModificado(carrito) {
    const cantidadTotal = carrito.reduce((t, i) => t + i.cantidad, 0);
    const precioTotal = this._carritoServicio.obtenerPrecioTotal();
    document.dispatchEvent(new CustomEvent('carrito:modificado', {
      detail: { carrito, cantidadTotal, precioTotal },
    }));
  }
}

export default ModeloCarrito;
