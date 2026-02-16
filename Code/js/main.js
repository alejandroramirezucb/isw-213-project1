document.addEventListener('DOMContentLoaded', () => {
    cargarNavbar();
    cargarProductos();
});

async function cargarNavbar() {
    try {
        const respuesta = await fetch('/api/navbar');
        const html = await respuesta.text();
        document.getElementById('navbar-placeholder').innerHTML = html;
    } catch (error) {
        console.error('Error al cargar el navbar:', error);
    }
}

async function cargarProductos() {
    const params = new URLSearchParams(window.location.search);
    const categoria = params.get('categoria');
    const query = params.get('q');

    let url = '/api/productos';
    if (categoria || query) {
        url += '?';
        if (categoria) url += `categoria=${categoria}&`;
        if (query) url += `q=${query}`;
    }

    console.log('Iniciando carga de productos...');
    try {
        const respuesta = await fetch(url);
        const productos = await respuesta.json();
        const contenedor = document.getElementById('contenedor-productos');
        
        if (!productos || productos.length === 0) {
            contenedor.innerHTML = '<p>No se encontraron productos disponibles.</p>';
            return;
        }

        const respuestaTarjeta = await fetch('/api/producto-tarjeta');
        const plantillaBase = await respuestaTarjeta.text();

        contenedor.innerHTML = '';

        productos.forEach(producto => {
            console.log('Procesando producto:', producto.name || 'Sin nombre');
            let imagenUrl = producto.images && producto.images[0] && producto.images[0].startsWith('http') 
                ? producto.images[0] 
                : 'https://resources.multicenter.com.bo/products/silla-gregor.jpg';

            let htmlTarjeta = plantillaBase
                .replace(/{{id}}/g, producto.id || '')
                .replace(/{{name}}/g, producto.name || 'Sin nombre')
                .replace(/{{brand}}/g, producto.brand || 'Genérico')
                .replace(/{{price}}/g, producto.price || '0')
                .replace(/{{image}}/g, imagenUrl)
                .replace(/{{cuota}}/g, producto.price ? (producto.price / 6).toFixed(2) : '0.00');
            
            const div = document.createElement('div');
            div.innerHTML = htmlTarjeta.trim();
            const tarjeta = div.firstElementChild;

            // Agregar evento al botón
            const botonAgregar = tarjeta.querySelector('.btn-agregar');
            botonAgregar.addEventListener('click', (e) => {
                e.stopPropagation();
                agregarAlCarrito({
                    id: producto.id,
                    nombre: producto.name,
                    precio: producto.price,
                    imagen: imagenUrl
                });
            });

            if (tarjeta) {
                contenedor.appendChild(tarjeta);
            }
        });
    } catch (error) {
        console.error('Error al cargar productos:', error);
    }
}

function agregarAlCarrito(producto) {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const index = carrito.findIndex(item => item.id === producto.id);

    if (index !== -1) {
        carrito[index].cantidad += 1;
    } else {
        producto.cantidad = 1;
        carrito.push(producto);
    }

    localStorage.setItem('carrito', JSON.stringify(carrito));
    alert(`${producto.nombre} agregado al carrito`);
    actualizarContadorCarrito();
}

function actualizarContadorCarrito() {
   
}
