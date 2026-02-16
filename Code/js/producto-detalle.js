document.addEventListener('DOMContentLoaded', () => {
    const pathParts = window.location.pathname.split('/');
    const productoId = pathParts[pathParts.length - 1];
    if (productoId) {
        cargarDetalleProducto(productoId);
    }
});

async function cargarDetalleProducto(id) {
    try {
        const respuesta = await fetch(`/api/productos/${id}`);
        const producto = await respuesta.json();
        const contenedor = document.getElementById('detalle-producto');

        const imagenUrl = producto.images && producto.images.length > 0 && producto.images[0].startsWith('http') 
            ? producto.images[0] 
            : 'https://resources.multicenter.com.bo/products/silla-gregor.jpg';

        contenedor.innerHTML = `
            <div class="detalle-imagen">
                <img src="${imagenUrl}" alt="${producto.name}">
            </div>
            <div class="detalle-info">
                <p class="detalle-info__marca">${producto.brand || 'Marca no disponible'}</p>
                <h1 class="detalle-info__nombre">${producto.name}</h1>
                <div class="detalle-info__precio">Bs. ${producto.price}</div>
                <p class="detalle-info__descripcion">${producto.description || 'Sin descripción disponible.'}</p>
                <button class="detalle-info__boton" id="btn-comprar">Agregar al Carrito</button>
            </div>
        `;

        document.getElementById('btn-comprar').addEventListener('click', () => {
            agregarAlCarritoDeDetalle(producto, imagenUrl);
        });

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('detalle-producto').innerHTML = '<p>Error al cargar el producto.</p>';
    }
}

function agregarAlCarritoDeDetalle(producto, imagen) {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const index = carrito.findIndex(item => item.id === producto.id);

    if (index !== -1) {
        carrito[index].cantidad += 1;
    } else {
        carrito.push({
            id: producto.id,
            nombre: producto.name,
            precio: producto.price,
            imagen: imagen,
            cantidad: 1
        });
    }

    localStorage.setItem('carrito', JSON.stringify(carrito));
    alert(`${producto.name} agregado al carrito`);
}
