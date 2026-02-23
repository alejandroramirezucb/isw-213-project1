document.addEventListener('DOMContentLoaded', function () {
  cargarNavbar().then(function () {
    var productoServicio = new ProductoServicio();
    var carritoServicio = new CarritoServicio();
    var actualizadorContador = new ActualizadorContador(carritoServicio);
    actualizadorContador.actualizar();

    var idProducto = obtenerIdProductoDesdeUrl();
    if (!idProducto) return;

    productoServicio
      .obtenerProductoPorId(idProducto)
      .then(function (producto) {
        renderizarDetalleProducto(
          producto,
          carritoServicio,
          actualizadorContador,
        );
      })
      .catch(function () {
        if (window.showToast) {
          window.showToast('Error al cargar el producto', { tipo: 'error' });
        }
      });
  });
});

function obtenerIdProductoDesdeUrl() {
  var partes = window.location.pathname.split('/');
  return partes[partes.length - 1];
}

function renderizarDetalleProducto(
  producto,
  carritoServicio,
  actualizadorContador,
) {
  var imagenPrincipal = document.querySelector('.detalle__imagen-foto');
  var galeriaMiniaturias = document.querySelector(
    '.detalle__galeria-miniaturas',
  );
  var nombreElemento = document.querySelector('.detalle__nombre');
  var precioElemento = document.querySelector('.detalle__precio');
  var descripcionElemento = document.querySelector(
    '.detalle__descripcion-texto',
  );
  var estadoStock = document.querySelector('.detalle__stock');
  var botonAgregar = document.querySelector('.detalle__boton-agregar');
  var cuotasElemento = document.querySelector('.detalle__cuotas');

  if (nombreElemento) nombreElemento.textContent = producto.nombre;
  if (precioElemento) {
    precioElemento.textContent =
      'Bs. ' + CalculadorPrecio.formatearPrecio(producto.precio);
  }
  if (descripcionElemento)
    descripcionElemento.textContent = producto.descripcion || '';
  if (cuotasElemento) {
    cuotasElemento.textContent =
      '12 cuotas de Bs. ' + CalculadorPrecio.calcularCuotas(producto.precio);
  }

  renderizarGaleriaImagenes(producto, imagenPrincipal, galeriaMiniaturias);
  renderizarEstadoStock(producto, estadoStock);

  var cantidadActual = 1;
  configurarControlesCantidad(producto, function (nuevaCantidad) {
    cantidadActual = nuevaCantidad;
  });

  configurarBotonAgregar(
    botonAgregar,
    producto,
    carritoServicio,
    actualizadorContador,
    function () {
      return cantidadActual;
    },
  );
}

function renderizarGaleriaImagenes(
  producto,
  imagenPrincipal,
  galeriaMiniaturias,
) {
  var imagenes = producto.imagenes || [];
  if (!imagenPrincipal || imagenes.length === 0) return;

  imagenPrincipal.src = imagenes[0];
  imagenPrincipal.alt = producto.nombre;

  if (!galeriaMiniaturias || imagenes.length <= 1) return;

  imagenes.forEach(function (urlImagen, indice) {
    var miniatura = document.createElement('img');
    miniatura.src = urlImagen;
    miniatura.alt = producto.nombre + ' - imagen ' + (indice + 1);
    miniatura.className = 'detalle__miniatura';
    if (indice === 0) miniatura.classList.add('detalle__miniatura--activa');

    miniatura.addEventListener('click', function () {
      imagenPrincipal.src = urlImagen;
      galeriaMiniaturias
        .querySelectorAll('.detalle__miniatura')
        .forEach(function (m) {
          m.classList.remove('detalle__miniatura--activa');
        });
      miniatura.classList.add('detalle__miniatura--activa');
    });

    galeriaMiniaturias.appendChild(miniatura);
  });
}

function renderizarEstadoStock(producto, estadoStock) {
  if (!estadoStock) return;
  var hayStock = producto.stock > 0;

  estadoStock.textContent = hayStock
    ? 'En stock (' + producto.stock + ' disponibles)'
    : 'Sin stock';
  estadoStock.className =
    'detalle__stock ' +
    (hayStock ? 'detalle__stock--disponible' : 'detalle__stock--agotado');
}

function configurarControlesCantidad(producto, alCambiar) {
  var campoCantidad = document.querySelector('.detalle__cantidad-input');
  var botonMenos = document.querySelector('.detalle__cantidad-boton--menos');
  var botonMas = document.querySelector('.detalle__cantidad-boton--mas');
  var cantidadActual = 1;

  if (botonMenos) {
    botonMenos.addEventListener('click', function () {
      if (cantidadActual > 1) {
        cantidadActual--;
        if (campoCantidad) campoCantidad.value = cantidadActual;
        alCambiar(cantidadActual);
      }
    });
  }

  if (botonMas) {
    botonMas.addEventListener('click', function () {
      if (cantidadActual < producto.stock) {
        cantidadActual++;
        if (campoCantidad) campoCantidad.value = cantidadActual;
        alCambiar(cantidadActual);
      }
    });
  }
}

function configurarBotonAgregar(
  botonAgregar,
  producto,
  carritoServicio,
  actualizadorContador,
  obtenerCantidad,
) {
  if (!botonAgregar) return;

  var hayStock = producto.stock > 0;
  if (!hayStock) {
    botonAgregar.disabled = true;
    botonAgregar.textContent = 'Sin stock';
    return;
  }

  botonAgregar.addEventListener('click', function () {
    var cantidad = obtenerCantidad();
    var resultado = carritoServicio.agregarProducto(producto, cantidad);

    if (resultado.exito === false) {
      if (window.showToast) {
        window.showToast(resultado.mensaje, { tipo: 'warning' });
      }
      return;
    }

    actualizadorContador.actualizar();

    if (window.showToast) {
      window.showToast(producto.nombre + ' agregado al carrito', {
        tipo: 'success',
        textoAccion: 'Ver carrito',
        accion: function () {
          window.location.href = '/carrito';
        },
      });
    }
  });
}
