var controladorProductos = null;
var controladorFiltros = null;

document.addEventListener('DOMContentLoaded', function () {
  cargarNavbar().then(function () {
    var productoServicio = new ProductoServicio();
    var carritoServicio = new CarritoServicio();
    var actualizadorContador = new ActualizadorContador(carritoServicio);

    controladorProductos = new ControladorProductos(
      productoServicio,
      carritoServicio,
      actualizadorContador,
    );

    controladorFiltros = new ControladorFiltros(controladorProductos);

    var botonBuscar = document.querySelector('.barra-navegacion__boton-buscar');
    var campoBusqueda = document.querySelector(
      '.barra-navegacion__campo-busqueda',
    );

    if (botonBuscar && campoBusqueda) {
      botonBuscar.addEventListener('click', function () {
        var busqueda = campoBusqueda.value.trim();
        controladorProductos.cargarProductos({ busqueda: busqueda });
      });
    }

    if (campoBusqueda) {
      campoBusqueda.addEventListener('keypress', function (evento) {
        if (evento.key === 'Enter') {
          var busqueda = campoBusqueda.value.trim();
          controladorProductos.cargarProductos({ busqueda: busqueda });
        }
      });
    }

    var parametros = new URLSearchParams(window.location.search);
    var filtrosIniciales = {};

    if (parametros.get('categoria')) {
      filtrosIniciales.categoria = parametros.get('categoria');
    }
    if (parametros.get('busqueda')) {
      filtrosIniciales.busqueda = parametros.get('busqueda');
      if (campoBusqueda) campoBusqueda.value = parametros.get('busqueda');
    }
    if (parametros.get('filtros') === 'mostrar') {
      controladorFiltros.alternarVisibilidad();
    }

    controladorProductos.cargarProductos(filtrosIniciales);
    actualizadorContador.actualizar();
  });
});
