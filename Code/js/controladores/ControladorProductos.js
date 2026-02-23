var plantillaTarjetaCache = null;

class ControladorProductos {
  constructor(productoServicio, carritoServicio, actualizadorContador) {
    this.productoServicio = productoServicio;
    this.carritoServicio = carritoServicio;
    this.actualizadorContador = actualizadorContador;
    this.filtrosActuales = {};
  }

  cargarProductos(filtros) {
    this.filtrosActuales = filtros || {};
    var contenedor = document.querySelector('.productos-grid');
    if (!contenedor) return Promise.resolve();

    var yo = this;

    return this.productoServicio
      .obtenerProductos(this.filtrosActuales)
      .then(function (productos) {
        while (contenedor.firstChild)
          contenedor.removeChild(contenedor.firstChild);

        if (!productos || productos.length === 0) {
          var mensajeVacio = document.createElement('p');
          mensajeVacio.className = 'contenedor-productos__mensaje-vacio';
          mensajeVacio.textContent = 'No se encontraron productos';
          contenedor.appendChild(mensajeVacio);
          return;
        }

        return yo._obtenerPlantilla().then(function (plantilla) {
          var carrito = yo.carritoServicio.obtenerCarrito();
          productos.forEach(function (producto) {
            var tarjeta = yo._crearTarjetaProducto(
              producto,
              plantilla,
              carrito,
            );
            contenedor.appendChild(tarjeta);
          });
        });
      })
      .catch(function () {
        if (window.showToast) {
          window.showToast('Error al cargar productos', { tipo: 'error' });
        }
      });
  }

  _obtenerPlantilla() {
    if (plantillaTarjetaCache) return Promise.resolve(plantillaTarjetaCache);
    return fetch('/api/producto-tarjeta')
      .then(function (respuesta) {
        return respuesta.text();
      })
      .then(function (texto) {
        plantillaTarjetaCache = texto;
        return texto;
      });
  }

  _crearTarjetaProducto(producto, plantilla, carrito) {
    var urlImagen =
      producto.imagenes && producto.imagenes.length > 0
        ? producto.imagenes[0]
        : '';
    var cuota = CalculadorPrecio.calcularCuotas(producto.precio);

    var html = plantilla
      .replace(/\{\{id\}\}/g, producto.id)
      .replace(/\{\{nombre\}\}/g, producto.nombre || '')
      .replace(
        /\{\{precio\}\}/g,
        CalculadorPrecio.formatearPrecio(producto.precio),
      )
      .replace(/\{\{imagen\}\}/g, urlImagen)
      .replace(/\{\{cuota\}\}/g, cuota);

    var parser = new DOMParser();
    var doc = parser.parseFromString(html.trim(), 'text/html');
    var tarjeta = doc.body.firstElementChild;

    this._configurarBotonCarrito(tarjeta, producto, carrito);
    return tarjeta;
  }

  _configurarBotonCarrito(tarjeta, producto, carrito) {
    var boton = tarjeta.querySelector('.tarjeta-producto__boton');
    if (!boton) return;

    var estaEnCarrito = carrito.some(function (item) {
      return item.id === producto.id;
    });
    var sinStock = !producto.stock || producto.stock <= 0;

    if (sinStock) {
      boton.textContent = 'Sin stock';
      boton.disabled = true;
      boton.classList.add('tarjeta-producto__boton--agotado');
    } else if (estaEnCarrito) {
      boton.textContent = 'En el carrito';
      boton.classList.add('tarjeta-producto__boton--en-carrito');
    }

    var yo = this;
    boton.addEventListener('click', function (evento) {
      evento.preventDefault();
      evento.stopPropagation();
      if (!sinStock) {
        yo._agregarAlCarrito(producto, boton);
      }
    });
  }

  _agregarAlCarrito(producto, boton) {
    var resultado = this.carritoServicio.agregarProducto(producto);

    if (resultado.exito === false) {
      if (window.showToast) {
        window.showToast(resultado.mensaje, { tipo: 'warning' });
      }
      return;
    }

    boton.textContent = 'En el carrito';
    boton.classList.add('tarjeta-producto__boton--en-carrito');
    this.actualizadorContador.actualizar();

    if (window.showToast) {
      window.showToast(producto.nombre + ' agregado al carrito', {
        tipo: 'success',
        textoAccion: 'Ver carrito',
        accion: function () {
          window.location.href = '/carrito';
        },
      });
    }
  }
}
