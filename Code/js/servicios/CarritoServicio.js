class CarritoServicio {
  constructor() {
    this.claveAlmacenamiento = 'raidencenter_carrito';
  }

  obtenerCarrito() {
    try {
      var datos = localStorage.getItem(this.claveAlmacenamiento);
      if (!datos) return [];
      var carrito = JSON.parse(datos);
      return carrito.map(this._normalizarItem);
    } catch (error) {
      localStorage.removeItem(this.claveAlmacenamiento);
      return [];
    }
  }

  _normalizarItem(item) {
    return {
      id: item.id,
      nombre: item.nombre || item.name || '',
      precio: parseFloat(item.precio || item.price || 0),
      imagen: item.imagen || item.image || item.url_imagen || '',
      cantidad: parseInt(item.cantidad || item.quantity || 1),
      stock: parseInt(item.stock || item.stock_disponible || 0),
    };
  }

  guardarCarrito(carrito) {
    localStorage.setItem(this.claveAlmacenamiento, JSON.stringify(carrito));
  }

  agregarProducto(producto, cantidad) {
    cantidad = cantidad || 1;
    var carrito = this.obtenerCarrito();
    var indice = carrito.findIndex(function (item) {
      return item.id === producto.id;
    });

    if (indice !== -1) {
      var nuevaCantidad = carrito[indice].cantidad + cantidad;
      if (nuevaCantidad > carrito[indice].stock) {
        return { exito: false, mensaje: 'Stock insuficiente' };
      }
      carrito[indice].cantidad = nuevaCantidad;
    } else {
      var imagenProducto = producto.imagen || producto.imagenes?.[0] || '';
      carrito.push({
        id: producto.id,
        nombre: producto.nombre,
        precio: parseFloat(producto.precio),
        imagen: imagenProducto,
        cantidad: cantidad,
        stock: parseInt(producto.stock || 0),
      });
    }

    this.guardarCarrito(carrito);
    return { exito: true, carrito: carrito };
  }

  eliminarProducto(idProducto) {
    var carrito = this.obtenerCarrito();
    var carritoFiltrado = carrito.filter(function (item) {
      return item.id !== idProducto;
    });
    this.guardarCarrito(carritoFiltrado);
    return carritoFiltrado;
  }

  actualizarCantidad(idProducto, nuevaCantidad) {
    var carrito = this.obtenerCarrito();
    var producto = carrito.find(function (item) {
      return item.id === idProducto;
    });

    if (!producto) return carrito;

    if (nuevaCantidad <= 0) {
      return this.eliminarProducto(idProducto);
    }

    if (nuevaCantidad > producto.stock && producto.stock > 0) {
      return { exito: false, mensaje: 'Stock insuficiente', carrito: carrito };
    }

    producto.cantidad = nuevaCantidad;
    this.guardarCarrito(carrito);
    return { exito: true, carrito: carrito };
  }

  vaciarCarrito() {
    this.guardarCarrito([]);
  }

  obtenerCantidadTotal() {
    var carrito = this.obtenerCarrito();
    return carrito.reduce(function (total, item) {
      return total + item.cantidad;
    }, 0);
  }

  obtenerPrecioTotal() {
    var carrito = this.obtenerCarrito();
    return carrito.reduce(function (total, item) {
      return total + item.precio * item.cantidad;
    }, 0);
  }

  limpiarCarrito() {
    this.vaciarCarrito();
  }
}
