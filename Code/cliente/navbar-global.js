class NavbarGlobal {
  constructor() {
    this._esPaginaInicio = ['/', '/index'].includes(window.location.pathname) || window.location.pathname.endsWith('index.html');
    this._bindEventos();
  }

  _bindEventos() {
    document.body.addEventListener('click', (e) => {
      if (e.target.closest('.barra-navegacion__boton-buscar')) this._ejecutarBusqueda();
      if (e.target.closest('.barra-navegacion__boton-filtros')) this._alternarFiltros();
    });

    document.body.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && e.target.closest('.barra-navegacion__campo-busqueda')) {
        this._ejecutarBusqueda();
      }
    });
  }

  _ejecutarBusqueda() {
    const campo = document.querySelector('.barra-navegacion__campo-busqueda');
    if (!campo) return;
    const termino = campo.value.trim();
    if (!termino) return;

    if (this._esPaginaInicio && window.controladorProductos) {
      window.controladorProductos.cargarProductos({ busqueda: termino });
    } else {
      window.location.href = `/?busqueda=${encodeURIComponent(termino)}`;
    }
  }

  _alternarFiltros() {
    if (this._esPaginaInicio && window.controladorFiltros) {
      window.controladorFiltros.alternarVisibilidad();
    } else {
      window.location.href = '/?filtros=mostrar';
    }
  }
}

export default NavbarGlobal;
