class ControladorGlobalNavbar {
    constructor() {
        this.inicializar();
    }

    inicializar() {
        this.configurarBuscador();
        this.configurarFiltros();
    }

    configurarBuscador() {
        const formBusqueda = document.querySelector('.barra-navegacion__search');
        if (!formBusqueda) return;

        formBusqueda.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = formBusqueda.querySelector('.barra-navegacion__search-input');
            const query = input ? input.value.trim() : '';
            
            if (query) {
                window.location.href = `/?q=${encodeURIComponent(query)}`;
            }
        });
    }

    configurarFiltros() {
        const btnFiltros = document.getElementById('btn-toggle-filtros');
        if (!btnFiltros) return;

        btnFiltros.addEventListener('click', () => {
            if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
                window.location.href = '/?filtros=show';
                return;
            }
            const panelFiltros = document.getElementById('panel-filtros');
            if (panelFiltros) {
                if (typeof controladorFiltros !== 'undefined') {
                    if (panelFiltros.style.display === 'none' || !panelFiltros.style.display) {
                        controladorFiltros.togglePanel();
                    }
                } else {
                    panelFiltros.style.display = (panelFiltros.style.display === 'none' || !panelFiltros.style.display) ? 'block' : 'none';
                }
            }
        });
    }
}
