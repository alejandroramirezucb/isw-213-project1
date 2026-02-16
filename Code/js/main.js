const productoServicio = new ProductoServicio();
const carritoServicio = new CarritoServicio();
const actualizadorContador = new ActualizadorContador(carritoServicio);
const controladorProductos = new ControladorProductos(productoServicio, carritoServicio, actualizadorContador);
const controladorFiltros = new ControladorFiltros(controladorProductos);

document.addEventListener('DOMContentLoaded', async () => {
    await cargarNavbar();
    const parametros = new URLSearchParams(window.location.search);
    const categoriaInicial = parametros.get('categoria');
    if (categoriaInicial) {
        controladorProductos.cargarProductos({ categoria: categoriaInicial });
    } else {
        controladorProductos.cargarProductos();
    }
    setTimeout(() => controladorFiltros.inicializar(), 100);
    configurarBusqueda();
});

async function cargarNavbar() {
    try {
        const respuesta = await fetch('/api/navbar');
        document.getElementById('navbar-placeholder').innerHTML = await respuesta.text();
        actualizadorContador.actualizar();
        adjuntarListenersCategorias();
    } catch (error) {
        console.error('Error al cargar el navbar:', error);
    }
}

function adjuntarListenersCategorias() {
    const enlaces = document.querySelectorAll('.barra-navegacion__dropdown-link');
    if (!enlaces) return;
    enlaces.forEach(enlace => {
        enlace.addEventListener('click', (e) => {
            e.preventDefault();
            const href = enlace.getAttribute('href') || '';
            const query = href.includes('?') ? href.split('?')[1] : (new URL(enlace.href)).searchParams.toString();
            const params = new URLSearchParams(query);
            const categoria = params.get('categoria');
            if (categoria) controladorProductos.cargarProductos({ categoria });
        });
    });
}

function configurarBusqueda() {
    document.addEventListener('submit', (evento) => {
        const formularioBusqueda = evento.target.closest('.barra-navegacion__search');
        if (formularioBusqueda) {
            evento.preventDefault();
            const inputBusqueda = formularioBusqueda.querySelector('.barra-navegacion__search-input');
            if (inputBusqueda && inputBusqueda.value.trim())
                controladorProductos.cargarProductos({ busqueda: inputBusqueda.value.trim() });
        }
    });
}
