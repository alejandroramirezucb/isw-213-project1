const productoServicio = new ProductoServicio();
const carritoServicio = new CarritoServicio();
const actualizadorContador = new ActualizadorContador(carritoServicio);

document.addEventListener('DOMContentLoaded', () => {
  const partesRuta = window.location.pathname.split('/');
  const idProducto = partesRuta[partesRuta.length - 1];
  if (idProducto) cargarDetalleProducto(idProducto);
});

async function cargarDetalleProducto(idProducto) {
  const contenedor = document.getElementById('detalle-producto');
  try {
    const producto = await productoServicio.obtenerPorId(idProducto);

    const urlImagen =
      producto.images &&
      producto.images.length > 0 &&
      producto.images[0].startsWith('http')
        ? producto.images[0]
        : 'https://resources.multicenter.com.bo/products/silla-gregor.jpg';

    const precio = producto.price || 0;
    const cuota = CalculadorPrecio.calcularCuotas(precio);
    const stock = producto.stock || 0;
    const carrito = carritoServicio.obtenerCarrito();
    const enCarrito = carrito.some((item) => item.id === producto.id);

    contenedor.innerHTML = '';

    const seccionImagen = construirSeccionImagen(producto.name);
    const seccionInfo = construirSeccionInfo(producto, precio, cuota, stock, enCarrito);

    contenedor.appendChild(seccionImagen);
    contenedor.appendChild(seccionInfo);

    if (stock > 0 && !enCarrito) {
      configurarControlesCantidad(stock);
      configurarBotonAgregar(producto, urlImagen);
    }

    requestAnimationFrame(() => {
      const imagenTemporal = new Image();
      imagenTemporal.onload = () => {
        const imagenElemento = document.getElementById('detalle-imagen-principal');
        if (imagenElemento) imagenElemento.src = urlImagen;
      };
      imagenTemporal.src = urlImagen;
    });

  } catch (error) {
    console.error('Error:', error);
    const parrafoError = document.createElement('p');
    parrafoError.className = 'detalle__error';
    parrafoError.textContent = 'Error al cargar el producto.';
    contenedor.innerHTML = '';
    contenedor.appendChild(parrafoError);
  }
}

function construirSeccionImagen(nombreProducto) {
  const contenedorImagen = document.createElement('div');
  contenedorImagen.className = 'detalle__imagen';

  const imagen = document.createElement('img');
  imagen.id = 'detalle-imagen-principal';
  imagen.className = 'detalle__imagen-foto';
  imagen.alt = nombreProducto;

  contenedorImagen.appendChild(imagen);
  return contenedorImagen;
}

function construirSeccionInfo(producto, precio, cuota, stock, enCarrito) {
  const contenedorInfo = document.createElement('div');
  contenedorInfo.className = 'detalle__info';

  const titulo = document.createElement('h1');
  titulo.className = 'detalle__nombre';
  titulo.textContent = producto.name;

  const contenedorPrecio = construirContenedorPrecio(precio, cuota);
  const contenedorDescripcion = construirContenedorDescripcion(producto.description);
  const parrafoStock = construirParrafoStock(stock);

  contenedorInfo.appendChild(titulo);
  contenedorInfo.appendChild(contenedorPrecio);
  contenedorInfo.appendChild(contenedorDescripcion);
  contenedorInfo.appendChild(parrafoStock);

  if (stock > 0 && !enCarrito) {
    const selectorCantidad = construirSelectorCantidad(stock);
    contenedorInfo.appendChild(selectorCantidad);
  }

  const botonAgregar = construirBotonAgregar(stock, enCarrito);
  contenedorInfo.appendChild(botonAgregar);

  return contenedorInfo;
}

function construirContenedorPrecio(precio, cuota) {
  const contenedorPrecio = document.createElement('div');
  contenedorPrecio.className = 'detalle__precio-contenedor';

  const textoPrecio = document.createElement('div');
  textoPrecio.className = 'detalle__precio';
  textoPrecio.textContent = `Bs. ${CalculadorPrecio.formatearPrecio(precio)}`;

  const textoCuotas = document.createElement('p');
  textoCuotas.className = 'detalle__cuotas';
  textoCuotas.textContent = `12 cuotas sin interés de Bs. ${cuota}`;

  contenedorPrecio.appendChild(textoPrecio);
  contenedorPrecio.appendChild(textoCuotas);
  return contenedorPrecio;
}

function construirContenedorDescripcion(descripcion) {
  const contenedorDescripcion = document.createElement('div');
  contenedorDescripcion.className = 'detalle__descripcion-contenedor';

  const tituloDescripcion = document.createElement('h3');
  tituloDescripcion.className = 'detalle__descripcion-titulo';
  tituloDescripcion.textContent = 'Descripción';

  const textoDescripcion = document.createElement('p');
  textoDescripcion.className = 'detalle__descripcion-texto';
  textoDescripcion.textContent = descripcion || 'Sin descripción disponible.';

  contenedorDescripcion.appendChild(tituloDescripcion);
  contenedorDescripcion.appendChild(textoDescripcion);
  return contenedorDescripcion;
}

function construirParrafoStock(stock) {
  const parrafoStock = document.createElement('p');
  if (stock > 0) {
    parrafoStock.className = 'detalle__stock detalle__stock--disponible';
    parrafoStock.textContent = `Stock disponible: ${stock} unidades`;
  } else {
    parrafoStock.className = 'detalle__stock detalle__stock--agotado';
    parrafoStock.textContent = 'Sin stock disponible';
  }
  return parrafoStock;
}

function construirSelectorCantidad(stock) {
  const contenedorSelector = document.createElement('div');
  contenedorSelector.className = 'detalle__cantidad-selector';

  const etiqueta = document.createElement('label');
  etiqueta.className = 'detalle__cantidad-etiqueta';
  etiqueta.htmlFor = 'cantidad';
  etiqueta.textContent = 'Cantidad:';

  const contenedorControles = document.createElement('div');
  contenedorControles.className = 'detalle__cantidad-controles';

  const botonDecrementar = document.createElement('button');
  botonDecrementar.id = 'btn-decrementar';
  botonDecrementar.className = 'detalle__cantidad-boton';
  botonDecrementar.type = 'button';
  botonDecrementar.textContent = '-';

  const inputCantidad = document.createElement('input');
  inputCantidad.id = 'cantidad';
  inputCantidad.className = 'detalle__cantidad-input';
  inputCantidad.type = 'number';
  inputCantidad.value = '1';
  inputCantidad.min = '1';
  inputCantidad.max = String(stock);

  const botonIncrementar = document.createElement('button');
  botonIncrementar.id = 'btn-incrementar';
  botonIncrementar.className = 'detalle__cantidad-boton';
  botonIncrementar.type = 'button';
  botonIncrementar.textContent = '+';

  contenedorControles.appendChild(botonDecrementar);
  contenedorControles.appendChild(inputCantidad);
  contenedorControles.appendChild(botonIncrementar);

  contenedorSelector.appendChild(etiqueta);
  contenedorSelector.appendChild(contenedorControles);
  return contenedorSelector;
}

function construirBotonAgregar(stock, enCarrito) {
  const boton = document.createElement('button');
  boton.id = 'btn-comprar';
  boton.className = 'detalle__boton-agregar';

  if (stock === 0) {
    boton.textContent = 'Agotado';
    boton.disabled = true;
    boton.classList.add('detalle__boton-agregar--deshabilitado');
  } else if (enCarrito) {
    boton.textContent = 'Agregado';
    boton.disabled = true;
    boton.classList.add('detalle__boton-agregar--deshabilitado');
  } else {
    boton.textContent = 'Agregar al Carrito';
  }

  return boton;
}

function configurarControlesCantidad(stockMaximo) {
  const inputCantidad = document.getElementById('cantidad');
  const botonIncrementar = document.getElementById('btn-incrementar');
  const botonDecrementar = document.getElementById('btn-decrementar');

  botonIncrementar.addEventListener('click', () => {
    const valorActual = parseInt(inputCantidad.value);
    if (valorActual < stockMaximo) inputCantidad.value = valorActual + 1;
  });

  botonDecrementar.addEventListener('click', () => {
    const valorActual = parseInt(inputCantidad.value);
    if (valorActual > 1) inputCantidad.value = valorActual - 1;
  });

  inputCantidad.addEventListener('change', function () {
    let valor = parseInt(this.value);
    if (isNaN(valor) || valor < 1) this.value = 1;
    else if (valor > stockMaximo) {
      this.value = stockMaximo;
      showToast(`Solo hay ${stockMaximo} unidades disponibles.`, { type: 'warning' });
    }
  });
}

function configurarBotonAgregar(producto, urlImagen) {
  const botonComprar = document.getElementById('btn-comprar');
  if (!botonComprar) return;

  botonComprar.addEventListener('click', async () => {
    const inputCantidad = document.getElementById('cantidad');
    const cantidad = parseInt(inputCantidad?.value) || 1;
    await agregarProductoAlCarrito(producto, urlImagen, cantidad);
  });
}

async function agregarProductoAlCarrito(producto, urlImagen, cantidad) {
  try {
    const infoStock = await productoServicio.verificarStock(producto.id);

    if (!infoStock.disponible || infoStock.stock === 0) {
      showToast('Lo sentimos, este producto no está disponible en stock.', { type: 'warning' });
      location.reload();
      return;
    }

    const carrito = carritoServicio.obtenerCarrito();
    const itemExistente = carrito.find((item) => item.id === producto.id);

    if (itemExistente) {
      if (itemExistente.cantidad + cantidad > infoStock.stock) {
        showToast(`Solo hay ${infoStock.stock} unidades disponibles.`, { type: 'warning' });
        return;
      }
    } else {
      if (cantidad > infoStock.stock) {
        showToast(`Solo hay ${infoStock.stock} unidades disponibles.`, { type: 'warning' });
        return;
      }
    }

    const productoParaCarrito = {
      id: producto.id,
      nombre: producto.name,
      name: producto.name,
      precio: producto.price,
      price: producto.price,
      imagen: urlImagen,
      url_imagen: urlImagen,
      images: [urlImagen],
      stock: infoStock.stock,
    };

    carritoServicio.agregarProducto(productoParaCarrito, cantidad);
    mostrarNotificacionExito(producto.name, cantidad);
    actualizadorContador.actualizar();

    const botonComprar = document.getElementById('btn-comprar');
    if (botonComprar) {
      botonComprar.textContent = 'Agregado';
      botonComprar.disabled = true;
      botonComprar.classList.add('detalle__boton-agregar--deshabilitado');
    }
  } catch (error) {
    console.error('Error al agregar al carrito:', error);
    showToast('Error al agregar el producto al carrito. Por favor, intente nuevamente.', { type: 'error' });
  }
}

function mostrarNotificacionExito(nombreProducto, cantidad) {
  const notificacion = document.getElementById('notificacion-carrito');
  if (!notificacion) return;

  const total = carritoServicio.obtenerPrecioTotal();
  const totalItems = carritoServicio.obtenerCantidadTotal();

  notificacion.innerHTML = '';

  const titulo = document.createElement('h4');
  titulo.textContent = '¡Añadido con Éxito!';

  const parrafoProducto = document.createElement('p');
  const negrita = document.createElement('strong');
  negrita.textContent = cantidad;
  parrafoProducto.append('Has agregado ', negrita, ` x ${nombreProducto}.`);

  const parrafoTotal = document.createElement('p');
  parrafoTotal.textContent = `Tienes ${totalItems} productos en total.`;

  const divMonto = document.createElement('div');
  divMonto.className = 'total';
  divMonto.textContent = `Total: Bs. ${total.toFixed(2)}`;

  const enlaceCarrito = document.createElement('a');
  enlaceCarrito.href = '/carrito';
  enlaceCarrito.className = 'btn-primary';
  enlaceCarrito.textContent = 'Ver mi Carrito';
  enlaceCarrito.style.cssText = 'display:block; margin-top:15px; text-align:center; padding:10px; font-size:14px; text-decoration:none; color:white; border-radius:20px;';

  notificacion.appendChild(titulo);
  notificacion.appendChild(parrafoProducto);
  notificacion.appendChild(parrafoTotal);
  notificacion.appendChild(divMonto);
  notificacion.appendChild(enlaceCarrito);

  notificacion.style.display = 'block';
  setTimeout(() => { notificacion.style.display = 'none'; }, 4000);
}
