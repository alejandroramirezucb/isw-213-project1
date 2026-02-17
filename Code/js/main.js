const productoServicio = new ProductoServicio();
const carritoServicio = new CarritoServicio();
const actualizadorContador = new ActualizadorContador(carritoServicio);
const controladorProductos = new ControladorProductos(
  productoServicio,
  carritoServicio,
  actualizadorContador,
);
const controladorFiltros = new ControladorFiltros(controladorProductos);

document.addEventListener('DOMContentLoaded', async () => {
  await cargarNavbar();
  const parametros = new URLSearchParams(window.location.search);
  const filtrosDesdeURL = {};
  const categoriaInicial = parametros.get('categoria');
  if (parametros.get('precioMinimo'))
    filtrosDesdeURL.precioMinimo = parametros.get('precioMinimo');
  if (parametros.get('precioMaximo'))
    filtrosDesdeURL.precioMaximo = parametros.get('precioMaximo');
  if (parametros.get('soloDisponibles'))
    filtrosDesdeURL.soloDisponibles =
      parametros.get('soloDisponibles') === 'true';
  if (parametros.get('busqueda'))
    filtrosDesdeURL.busqueda = parametros.get('busqueda');
  if (categoriaInicial) filtrosDesdeURL.categoria = categoriaInicial;
  if (Object.keys(filtrosDesdeURL).length) {
    controladorProductos.cargarProductos(filtrosDesdeURL);
  } else {
    controladorProductos.cargarProductos();
  }
  setTimeout(() => {
    controladorFiltros.inicializar();
    if (parametros.get('filtros') === 'show') {
      controladorFiltros.togglePanel();
    }
  }, 150);
  configurarBusqueda();
});

async function cargarNavbar() {
  try {
    const respuesta = await fetch('/api/navbar');
    document.getElementById('navbar-placeholder').innerHTML =
      await respuesta.text();

    if (typeof actualizarIconoUsuario === 'function')
      await actualizarIconoUsuario();

    actualizadorContador.actualizar();
    adjuntarListenersCategorias();
  } catch (error) {
    console.error('Error al cargar el navbar:', error);
  }
}

function adjuntarListenersCategorias() {
  const enlaces = document.querySelectorAll('.barra-navegacion__dropdown-link');
  if (!enlaces) return;
  enlaces.forEach((enlace) => {
    enlace.addEventListener('click', (e) => {
      e.preventDefault();
      const href = enlace.getAttribute('href') || '';
      const query = href.includes('?')
        ? href.split('?')[1]
        : new URL(enlace.href).searchParams.toString();
      const params = new URLSearchParams(query);
      const categoria = params.get('categoria');
      if (categoria) controladorProductos.cargarProductos({ categoria });
    });
  });
}

function configurarBusqueda() {
  document.addEventListener('submit', (evento) => {
    const formularioBusqueda = evento.target.closest(
      '.barra-navegacion__search',
    );
    if (formularioBusqueda) {
      evento.preventDefault();
      const inputBusqueda = formularioBusqueda.querySelector(
        '.barra-navegacion__search-input',
      );
      if (inputBusqueda && inputBusqueda.value.trim())
        controladorProductos.cargarProductos({
          busqueda: inputBusqueda.value.trim(),
        });
    }
  });
}
