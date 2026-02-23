(function () {
  var esPaginaInicio =
    window.location.pathname === '/' ||
    window.location.pathname === '/index' ||
    window.location.pathname.endsWith('index.html');

  document.body.addEventListener('click', function (evento) {
    var botonBuscar = evento.target.closest('.barra-navegacion__boton-buscar');
    var botonFiltros = evento.target.closest(
      '.barra-navegacion__boton-filtros',
    );

    if (botonBuscar) {
      ejecutarBusqueda();
    }

    if (botonFiltros) {
      alternarPanelFiltros();
    }
  });

  document.body.addEventListener('keypress', function (evento) {
    if (
      evento.key === 'Enter' &&
      evento.target.closest('.barra-navegacion__campo-busqueda')
    ) {
      ejecutarBusqueda();
    }
  });

  function ejecutarBusqueda() {
    var campoBusqueda = document.querySelector(
      '.barra-navegacion__campo-busqueda',
    );
    if (!campoBusqueda) return;

    var termino = campoBusqueda.value.trim();
    if (!termino) return;

    if (esPaginaInicio && typeof controladorProductos !== 'undefined') {
      controladorProductos.cargarProductos({ busqueda: termino });
    } else {
      window.location.href = '/?busqueda=' + encodeURIComponent(termino);
    }
  }

  function alternarPanelFiltros() {
    if (esPaginaInicio && typeof controladorFiltros !== 'undefined') {
      controladorFiltros.alternarVisibilidad();
    } else {
      window.location.href = '/?filtros=mostrar';
    }
  }
})();
