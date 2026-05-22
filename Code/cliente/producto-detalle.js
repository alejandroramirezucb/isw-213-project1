import cargarNavbar from './navbar-comun.js';
import CarritoServicio from './servicios/CarritoServicio.js';
import ProductoServicio from './servicios/ProductoServicio.js';
import ActualizadorContador from './utilidades/ActualizadorContador.js';
import CalculadorPrecio from './utilidades/CalculadorPrecio.js';
import './utilidades/Toaster.js';

document.addEventListener('DOMContentLoaded', async () => {
  await cargarNavbar();

  const carritoServicio = new CarritoServicio();
  const productoServicio = new ProductoServicio();
  const actualizadorContador = new ActualizadorContador(carritoServicio);
  actualizadorContador.actualizar();

  const partes = window.location.pathname.split('/');
  const idProducto = partes[partes.length - 1];
  if (!idProducto) return;

  try {
    const producto = await productoServicio.obtenerProductoPorId(idProducto);
    _renderizarDetalleProducto(producto, carritoServicio, actualizadorContador);
  } catch {
    if (window.showToast) window.showToast('Error al cargar el producto', { tipo: 'error' });
  }
});

function _renderizarDetalleProducto(producto, carritoServicio, actualizadorContador) {
  const q = (sel) => document.querySelector(sel);

  if (q('.detalle__nombre')) q('.detalle__nombre').textContent = producto.nombre;
  if (q('.detalle__precio')) q('.detalle__precio').textContent = `Bs. ${CalculadorPrecio.formatearPrecio(producto.precio)}`;
  if (q('.detalle__descripcion-texto')) q('.detalle__descripcion-texto').textContent = producto.descripcion || '';
  if (q('.detalle__cuotas')) q('.detalle__cuotas').textContent = `12 cuotas de Bs. ${CalculadorPrecio.calcularCuotas(producto.precio)}`;

  _renderizarGaleria(producto, q('.detalle__imagen-foto'), q('.detalle__galeria-miniaturas'));
  _renderizarStock(producto, q('.detalle__stock'));

  let cantidadActual = 1;
  _bindControlesCantidad(producto, (nueva) => { cantidadActual = nueva; });
  _bindBotonAgregar(q('.detalle__boton-agregar'), producto, carritoServicio, actualizadorContador, () => cantidadActual);
}

function _renderizarGaleria(producto, imagenPrincipal, galeria) {
  const imagenes = producto.imagenes || [];
  if (!imagenPrincipal || imagenes.length === 0) return;
  imagenPrincipal.src = imagenes[0];
  imagenPrincipal.alt = producto.nombre;
  if (!galeria || imagenes.length <= 1) return;

  imagenes.forEach((url, i) => {
    const miniatura = document.createElement('img');
    miniatura.src = url;
    miniatura.alt = `${producto.nombre} - imagen ${i + 1}`;
    miniatura.className = 'detalle__miniatura';
    if (i === 0) miniatura.classList.add('detalle__miniatura--activa');
    miniatura.addEventListener('click', () => {
      imagenPrincipal.src = url;
      galeria.querySelectorAll('.detalle__miniatura').forEach((m) => m.classList.remove('detalle__miniatura--activa'));
      miniatura.classList.add('detalle__miniatura--activa');
    });
    galeria.appendChild(miniatura);
  });
}

function _renderizarStock(producto, estadoStock) {
  if (!estadoStock) return;
  const hayStock = producto.stock > 0;
  estadoStock.textContent = hayStock ? `En stock (${producto.stock} disponibles)` : 'Sin stock';
  estadoStock.className = `detalle__stock ${hayStock ? 'detalle__stock--disponible' : 'detalle__stock--agotado'}`;
}

function _bindControlesCantidad(producto, alCambiar) {
  const campoCantidad = document.querySelector('.detalle__cantidad-input');
  const botonMenos = document.querySelector('.detalle__cantidad-boton--menos');
  const botonMas = document.querySelector('.detalle__cantidad-boton--mas');
  let cantidadActual = 1;

  botonMenos?.addEventListener('click', () => {
    if (cantidadActual > 1) { cantidadActual--; if (campoCantidad) campoCantidad.value = cantidadActual; alCambiar(cantidadActual); }
  });

  botonMas?.addEventListener('click', () => {
    if (cantidadActual < producto.stock) { cantidadActual++; if (campoCantidad) campoCantidad.value = cantidadActual; alCambiar(cantidadActual); }
  });
}

function _bindBotonAgregar(botonAgregar, producto, carritoServicio, actualizadorContador, obtenerCantidad) {
  if (!botonAgregar) return;
  if (producto.stock <= 0) { botonAgregar.disabled = true; botonAgregar.textContent = 'Sin stock'; return; }

  botonAgregar.addEventListener('click', () => {
    const resultado = carritoServicio.agregarProducto(producto, obtenerCantidad());
    if (resultado.exito === false) {
      if (window.showToast) window.showToast(resultado.mensaje, { tipo: 'warning' });
      return;
    }
    actualizadorContador.actualizar();
    if (window.showToast) {
      window.showToast(`${producto.nombre} agregado al carrito`, { tipo: 'success', textoAccion: 'Ver carrito', accion: () => { window.location.href = '/carrito'; } });
    }
  });
}
