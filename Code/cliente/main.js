import cargarNavbar from './navbar-comun.js';
import NavbarGlobal from './navbar-global.js';
import CarritoServicio from './servicios/CarritoServicio.js';
import ProductoServicio from './servicios/ProductoServicio.js';
import ActualizadorContador from './utilidades/ActualizadorContador.js';
import ControladorProductos from './controladores/ControladorProductos.js';
import ControladorFiltros from './controladores/ControladorFiltros.js';
import './utilidades/Toaster.js';

let controladorProductos = null;
let controladorFiltros = null;

document.addEventListener('DOMContentLoaded', async () => {
  await cargarNavbar();

  const carritoServicio = new CarritoServicio();
  const productoServicio = new ProductoServicio();
  const actualizadorContador = new ActualizadorContador(carritoServicio);

  controladorProductos = new ControladorProductos(productoServicio, carritoServicio, actualizadorContador);
  window.controladorProductos = controladorProductos;

  controladorFiltros = new ControladorFiltros(controladorProductos);
  window.controladorFiltros = controladorFiltros;

  new NavbarGlobal();

  const campoBusqueda = document.querySelector('.barra-navegacion__campo-busqueda');

  const parametros = new URLSearchParams(window.location.search);
  const filtrosIniciales = {};
  if (parametros.get('categoria')) filtrosIniciales.categoria = parametros.get('categoria');
  if (parametros.get('busqueda')) {
    filtrosIniciales.busqueda = parametros.get('busqueda');
    if (campoBusqueda) campoBusqueda.value = parametros.get('busqueda');
  }
  if (parametros.get('filtros') === 'mostrar') controladorFiltros.alternarVisibilidad();

  controladorProductos.cargarProductos(filtrosIniciales);
  actualizadorContador.actualizar();
});
