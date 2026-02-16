document.addEventListener('DOMContentLoaded', () => {
    mostrarCarrito();
});

function mostrarCarrito() {
    const contenedor = document.getElementById('lista-carrito');
    const totalElemento = document.getElementById('total-precio');
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];

    if (carrito.length === 0) {
        contenedor.innerHTML = '<p style="text-align: center; padding: 20px;">Tu carrito está vacío.</p>';
        totalElemento.innerText = 'Bs. 0.00';
        return;
    }

    contenedor.innerHTML = '';
    let total = 0;

    carrito.forEach((producto, index) => {
        const subtotal = producto.precio * producto.cantidad;
        total += subtotal;

        const div = document.createElement('div');
        div.className = 'item-carrito';
        div.innerHTML = `
            <img src="${producto.imagen}" alt="${producto.nombre}">
            <div class="item-carrito__info">
                <div class="item-carrito__nombre">${producto.nombre}</div>
                <div class="item-carrito__precio">Bs. ${producto.precio}</div>
            </div>
            <div class="item-carrito__controles">
                <button onclick="cambiarCantidad(${index}, -1)">-</button>
                <span class="item-carrito__cantidad">${producto.cantidad}</span>
                <button onclick="cambiarCantidad(${index}, 1)">+</button>
                <button class="btn-eliminar" onclick="eliminarProducto(${index})">×</button>
            </div>
        `;
        contenedor.appendChild(div);
    });

    totalElemento.innerText = `Bs. ${total.toFixed(2)}`;
}

function cambiarCantidad(index, delta) {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    carrito[index].cantidad += delta;

    if (carrito[index].cantidad <= 0) {
        carrito.splice(index, 1);
    }

    localStorage.setItem('carrito', JSON.stringify(carrito));
    mostrarCarrito();
}

function eliminarProducto(index) {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    carrito.splice(index, 1);
    localStorage.setItem('carrito', JSON.stringify(carrito));
    mostrarCarrito();
}

document.getElementById('btn-finalizar').addEventListener('click', async () => {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    if (carrito.length === 0) {
        alert('El carrito está vacío');
        return;
    }

    const metodoEntrega = confirm('¿Desea envío por Delivery? (Aceptar para Delivery, Cancelar para Recoger en Almacén)');
    const entrega = metodoEntrega ? 'delivery' : 'recojo_almacen';

    const metodoPago = prompt('Elija su método de pago (efectivo, tarjeta, qr):').toLowerCase();
    const metodosValidos = ['efectivo', 'tarjeta', 'qr'];

    if (!metodosValidos.includes(metodoPago)) {
        alert('Método de pago no válido. Operación cancelada.');
        return;
    }

    alert(`¡Gracias por su compra!\n\nMétodo de entrega: ${entrega}\nMétodo de pago: ${metodoPago}\n\nProcesando su pedido...`);
    
    localStorage.removeItem('carrito');
    window.location.href = '/';
});
