class CarritoServicio {
  constructor() {
    this.claveLocalStorage = 'carrito';
  }

  _normalizarItem(item = {}) {
    const precioNum = Number(item.precio ?? item.price ?? 0) || 0;
    const cantidadNum = Number(item.cantidad ?? item.quantity ?? 1) || 0;
    const imagen =
      item.imagen || item.url_imagen || (item.images && item.images[0]) || '';

    return {
      id: item.id,
      nombre: item.nombre || item.name || '',
      name: item.name || item.nombre || '',
      precio: precioNum,
      price: precioNum,
      imagen,
      url_imagen: imagen,
      images:
        Array.isArray(item.images) && item.images.length
          ? item.images
          : imagen
            ? [imagen]
            : [],
      cantidad: cantidadNum,
      stock: item.stock ?? item.stock_disponible ?? null,
    };
  }

  obtenerCarrito() {
    let parsed = [];
    try {
      const rawStr = localStorage.getItem(this.claveLocalStorage);
      if (!rawStr) parsed = [];
      else {
        const tmp = JSON.parse(rawStr);
        if (Array.isArray(tmp)) parsed = tmp;
        else if (tmp && typeof tmp === 'object' && tmp.id !== undefined)
          parsed = [tmp];
        else parsed = [];
      }
    } catch (err) {
      console.warn(
        'Error leyendo carrito desde localStorage, limpiando valor inválido:',
        err,
      );
      parsed = [];
      localStorage.removeItem(this.claveLocalStorage);
    }

    return parsed.map((it) => this._normalizarItem(it));
  }

  guardarCarrito(carrito) {
    const normalizados = (Array.isArray(carrito) ? carrito : []).map((it) =>
      this._normalizarItem(it),
    );
    localStorage.setItem(this.claveLocalStorage, JSON.stringify(normalizados));
    try {
      console.debug('CarritoGuardado:', this.claveLocalStorage, normalizados);
    } catch (e) {}
  }

  agregarProducto(producto, cantidad = 1) {
    console.debug('AgregarProducto llamado:', producto, 'cantidad=', cantidad);
    const carrito = this.obtenerCarrito();
    const indice = carrito.findIndex((item) => item.id === producto.id);
    const cantidadNum = Number(cantidad) || 0;

    if (indice !== -1) {
      carrito[indice].cantidad =
        Number(carrito[indice].cantidad || 0) + cantidadNum;
    } else {
      const nuevo = this._normalizarItem({
        ...producto,
        cantidad: cantidadNum,
      });
      carrito.push(nuevo);
    }

    this.guardarCarrito(carrito);
    console.debug('Carrito tras agregar:', carrito);
    return carrito;
  }

  actualizarCantidad(indiceProducto, nuevaCantidad) {
    const carrito = this.obtenerCarrito();
    const nueva = Number(nuevaCantidad) || 0;

    if (indiceProducto >= 0 && indiceProducto < carrito.length) {
      carrito[indiceProducto].cantidad = nueva;
      this.guardarCarrito(carrito);
    }

    return carrito;
  }

  eliminarProducto(indiceProducto) {
    const carrito = this.obtenerCarrito();
    if (indiceProducto >= 0 && indiceProducto < carrito.length) {
      carrito.splice(indiceProducto, 1);
      this.guardarCarrito(carrito);
    }
    return carrito;
  }

  obtenerCantidadTotal() {
    const carrito = this.obtenerCarrito();
    return carrito.reduce(
      (total, item) => total + (Number(item.cantidad) || 0),
      0,
    );
  }

  obtenerPrecioTotal() {
    const carrito = this.obtenerCarrito();
    return carrito.reduce(
      (total, item) =>
        total + (Number(item.precio) || 0) * (Number(item.cantidad) || 0),
      0,
    );
  }

  limpiarCarrito() {
    localStorage.removeItem(this.claveLocalStorage);
  }
}
