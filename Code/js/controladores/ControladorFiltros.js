class ControladorFiltros {
    constructor(controladorProductos) {
        this.controladorProductos = controladorProductos;
        this.panelVisible = false;
    }

    inicializar() {
        this.configurarEventos();
    }


    configurarEventos() {
        const botonToggle = document.getElementById('btn-toggle-filtros');
        if (botonToggle)
            botonToggle.addEventListener('click', () => this.togglePanel());

        const botonAplicar = document.getElementById('btn-aplicar-filtros');
        if (botonAplicar)
            botonAplicar.addEventListener('click', () => this.aplicarFiltros());

        const botonLimpiar = document.getElementById('btn-limpiar-filtros');
        if (botonLimpiar)
            botonLimpiar.addEventListener('click', () => this.limpiarFiltros());
    }

    togglePanel() {
        const panel = document.getElementById('panel-filtros');
        if (!panel) return;

        this.panelVisible = !this.panelVisible;
        panel.style.display = this.panelVisible ? 'block' : 'none';
    }

    aplicarFiltros() {
        const precioMinimo = document.getElementById('filtro-precio-minimo')?.value;
        const precioMaximo = document.getElementById('filtro-precio-maximo')?.value;
        const soloDisponibles = document.getElementById('filtro-solo-disponibles')?.checked;

        const filtros = {};
        
        if (precioMinimo) filtros.precioMinimo = precioMinimo;
        if (precioMaximo) filtros.precioMaximo = precioMaximo;
        if (soloDisponibles) filtros.soloDisponibles = 'true';

        const inputBusqueda = document.querySelector('.barra-navegacion__search-input');
        if (inputBusqueda && inputBusqueda.value.trim())
            filtros.busqueda = inputBusqueda.value.trim();

        this.controladorProductos.cargarProductos(filtros);
    }

    limpiarFiltros() {
        const precioMinimo = document.getElementById('filtro-precio-minimo');
        const precioMaximo = document.getElementById('filtro-precio-maximo');
        const soloDisponibles = document.getElementById('filtro-solo-disponibles');

        if (precioMinimo) precioMinimo.value = '';
        if (precioMaximo) precioMaximo.value = '';
        if (soloDisponibles) soloDisponibles.checked = false;

        this.controladorProductos.limpiarFiltros();
    }
}

