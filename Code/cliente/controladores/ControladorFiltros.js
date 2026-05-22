class ControladorFiltros {
  constructor(controladorProductos) {
    this.controladorProductos = controladorProductos;
    this.panelFiltros = document.querySelector('.panel-filtros');
    this._inicializarEventos();
  }

  _inicializarEventos() {
    if (!this.panelFiltros) return;

    var botonAplicar = this.panelFiltros.querySelector('.boton-primario');
    var botonLimpiar = this.panelFiltros.querySelector('.boton-secundario');
    var yo = this;

    if (botonAplicar) {
      botonAplicar.addEventListener('click', function () {
        yo.aplicarFiltros();
      });
    }

    if (botonLimpiar) {
      botonLimpiar.addEventListener('click', function () {
        yo.limpiarFiltros();
      });
    }
  }

  alternarVisibilidad() {
    if (!this.panelFiltros) return;
    this.panelFiltros.classList.toggle('panel-filtros--visible');
  }

  aplicarFiltros() {
    var filtros = this._obtenerValoresFiltros();
    this.controladorProductos.cargarProductos(filtros);
  }

  limpiarFiltros() {
    var campoPrecioMinimo = document.getElementById('precioMinimo');
    var campoPrecioMaximo = document.getElementById('precioMaximo');
    var campoDisponibles = document.getElementById('soloDisponibles');

    if (campoPrecioMinimo) campoPrecioMinimo.value = '';
    if (campoPrecioMaximo) campoPrecioMaximo.value = '';
    if (campoDisponibles) campoDisponibles.checked = false;

    this.controladorProductos.cargarProductos({});
  }

  _obtenerValoresFiltros() {
    var filtros = {};

    var campoPrecioMinimo = document.getElementById('precioMinimo');
    var campoPrecioMaximo = document.getElementById('precioMaximo');
    var campoDisponibles = document.getElementById('soloDisponibles');

    if (campoPrecioMinimo && campoPrecioMinimo.value) {
      filtros.precioMinimo = campoPrecioMinimo.value;
    }
    if (campoPrecioMaximo && campoPrecioMaximo.value) {
      filtros.precioMaximo = campoPrecioMaximo.value;
    }
    if (campoDisponibles && campoDisponibles.checked) {
      filtros.soloDisponibles = 'true';
    }

    return filtros;
  }
}

export default ControladorFiltros;
