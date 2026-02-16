const productoServicio = new ProductoServicio();
const carritoServicio = new CarritoServicio();
const actualizadorContador = new ActualizadorContador(carritoServicio);

document.addEventListener('DOMContentLoaded', async () => {
    await mostrarCarrito();
    configurarBotonFinalizar();
});

async function mostrarCarrito() {
    const contenedor = document.getElementById('lista-carrito');
    const elementoTotal = document.getElementById('total-precio');
    const carrito = carritoServicio.obtenerCarrito();

    if (carrito.length === 0) {
        mostrarCarritoVacio(contenedor, elementoTotal);
        return;
    }

    const carritoActualizado = await verificarStockCarrito(carrito);
    renderizarProductosCarrito(contenedor, carritoActualizado);
    actualizarTotalCarrito(elementoTotal, carritoActualizado);
    actualizadorContador.actualizar();
}

function mostrarCarritoVacio(contenedor, elementoTotal) {
    contenedor.innerHTML = `
        <div class="carrito-vacio">
            <h3>Tu carrito está vacío</h3>
            <p>Agrega productos para comenzar a comprar</p>
            <a href="/" class="btn-primary">Ir a la tienda</a>
        </div>
    `;
    elementoTotal.innerText = 'Bs. 0.00';
    actualizadorContador.actualizar();
}

async function verificarStockCarrito(carrito) {
    const carritoActualizado = [];
    let huboCambios = false;

    for (const item of carrito) {
        try {
            const infoStock = await productoServicio.verificarStock(item.id);

            if (!infoStock.disponible || infoStock.stock === 0) {
                alert(`El producto "${item.nombre}" ya no está disponible y será eliminado del carrito.`);
                huboCambios = true;
                continue;
            }

            if (item.cantidad > infoStock.stock) {
                alert(`El producto "${item.nombre}" tiene menos stock del que solicitaste. Se ajustó a ${infoStock.stock} unidades.`);
                item.cantidad = infoStock.stock;
                huboCambios = true;
            }

            item.stock = infoStock.stock;
            carritoActualizado.push(item);
        } catch (error) {
            console.error(`Error al verificar stock de producto ${item.id}:`, error);
            carritoActualizado.push(item);
        }
    }

    if (huboCambios)
        carritoServicio.guardarCarrito(carritoActualizado);

    return carritoActualizado;
}

function renderizarProductosCarrito(contenedor, carrito) {
    contenedor.innerHTML = '';

    carrito.forEach((producto, indice) => {
        const subtotal = CalculadorPrecio.calcularSubtotal(producto.precio, producto.cantidad);
        const stock = producto.stock || 999;

        const divItem = document.createElement('div');
        divItem.className = 'item-carrito';
        
        divItem.innerHTML = `
            <img src="${producto.imagen}" alt="${producto.nombre}">
            <div class="item-carrito__info">
                <div class="item-carrito__nombre">${producto.nombre}</div>
                <div class="item-carrito__precio">Bs. ${CalculadorPrecio.formatearPrecio(producto.precio)}</div>
                <div class="item-carrito__stock">Stock disponible: ${stock} unidades</div>
                <div class="item-carrito__subtotal">Subtotal: Bs. ${subtotal}</div>
            </div>
            <div class="item-carrito__controles">
                <div class="cantidad-controles">
                    <button onclick="cambiarCantidad(${indice}, -1)">-</button>
                    <input type="number" value="${producto.cantidad}" min="1" max="${stock}"
                           onchange="actualizarCantidad(${indice}, this.value)">
                    <button onclick="cambiarCantidad(${indice}, 1)">+</button>
                </div>
                <button class="btn-eliminar" onclick="eliminarProducto(${indice})">Eliminar</button>
            </div>
        `;
        
        contenedor.appendChild(divItem);
    });
}

function actualizarTotalCarrito(elementoTotal, carrito) {
    const cantidadTotal = carrito.reduce((total, item) => total + item.cantidad, 0);
    const precioTotal = carritoServicio.obtenerPrecioTotal();

    const contenedorTotal = elementoTotal.parentElement;
    if (contenedorTotal) {
        contenedorTotal.innerHTML = `
            <div class="resumen-total">
                <div class="resumen-linea">
                    <span>Productos:</span>
                    <span>${cantidadTotal} unidad${cantidadTotal !== 1 ? 'es' : ''}</span>
                </div>
                <div class="resumen-linea total">
                    <span>Total:</span>
                    <span id="total-precio">Bs. ${precioTotal.toFixed(2)}</span>
                </div>
            </div>
        `;
    } else {
        elementoTotal.innerText = `Bs. ${precioTotal.toFixed(2)}`;
    }
}

async function cambiarCantidad(indice, cambio) {
    const carrito = carritoServicio.obtenerCarrito();
    
    if (indice < 0 || indice >= carrito.length) return;

    const item = carrito[indice];
    const cantidadNueva = item.cantidad + cambio;

    if (cantidadNueva < 1) {
        if (confirm('¿Deseas eliminar este producto del carrito?'))
            eliminarProducto(indice);
        return;
    }

    try {
        const infoStock = await productoServicio.verificarStock(item.id);

        if (!infoStock.disponible || infoStock.stock === 0) {
            alert('Este producto ya no está disponible.');
            eliminarProducto(indice);
            return;
        }

        if (cantidadNueva > infoStock.stock) {
            alert(`Solo hay ${infoStock.stock} unidades disponibles.`);
            return;
        }

        carritoServicio.actualizarCantidad(indice, cantidadNueva);
        await mostrarCarrito();
    } catch (error) {
        console.error('Error al verificar stock:', error);
        alert('Error al actualizar la cantidad. Por favor, intente nuevamente.');
    }
}

async function actualizarCantidad(indice, nuevaCantidadStr) {
    const nuevaCantidad = parseInt(nuevaCantidadStr);
    
    if (isNaN(nuevaCantidad) || nuevaCantidad < 1) {
        alert('La cantidad debe ser al menos 1.');
        await mostrarCarrito();
        return;
    }

    const carrito = carritoServicio.obtenerCarrito();
    
    if (indice < 0 || indice >= carrito.length) return;

    const item = carrito[indice];

    try {
        const infoStock = await productoServicio.verificarStock(item.id);

        if (!infoStock.disponible || infoStock.stock === 0) {
            alert('Este producto ya no está disponible.');
            eliminarProducto(indice);
            return;
        }

        if (nuevaCantidad > infoStock.stock) {
            alert(`Solo hay ${infoStock.stock} unidades disponibles.`);
            await mostrarCarrito();
            return;
        }

        carritoServicio.actualizarCantidad(indice, nuevaCantidad);
        await mostrarCarrito();
    } catch (error) {
        console.error('Error al verificar stock:', error);
        alert('Error al actualizar la cantidad. Por favor, intente nuevamente.');
        await mostrarCarrito();
    }
}

function eliminarProducto(indice) {
    const carrito = carritoServicio.obtenerCarrito();
    const producto = carrito[indice];
    
    if (confirm(`¿Estás seguro de eliminar "${producto.nombre}" del carrito?`)) {
        carritoServicio.eliminarProducto(indice);
        mostrarCarrito();
    }
}

function configurarBotonFinalizar() {
    const btnFinalizar = document.getElementById('btn-finalizar');
    if (!btnFinalizar) return;

    btnFinalizar.addEventListener('click', async () => {
        const carrito = carritoServicio.obtenerCarrito();
        
        if (carrito.length === 0) {
            alert('El carrito está vacío');
            return;
        }

        const carritoActualizado = await verificarStockCarrito(carrito);
        
        if (carritoActualizado.length === 0) {
            alert('No hay productos disponibles en el carrito.');
            return;
        }

        const metodoEntrega = confirm('¿Desea envío por Delivery?\n\nAceptar = Delivery\nCancelar = Recoger en Almacén');
        const entrega = metodoEntrega ? 'delivery' : 'recojo_almacen';

        const metodoPago = prompt('Elija su método de pago:\n\n- efectivo\n- tarjeta\n- qr');
        if (!metodoPago) return;

        const metodoPagoNormalizado = metodoPago.toLowerCase();
        const metodosValidos = ['efectivo', 'tarjeta', 'qr'];

        if (!metodosValidos.includes(metodoPagoNormalizado)) {
            alert('Método de pago no válido. Operación cancelada.');
            return;
        }

        const total = carritoServicio.obtenerPrecioTotal();
        const cantidad = carritoServicio.obtenerCantidadTotal();

        const textoEntrega = entrega === 'delivery' ? 'Delivery' : 'Recoger en Almacén';
        alert(`¡Gracias por su compra!\n\nProductos: ${cantidad} unidad${cantidad !== 1 ? 'es' : ''}\nTotal: Bs. ${total.toFixed(2)}\nMétodo de entrega: ${textoEntrega}\nMétodo de pago: ${metodoPagoNormalizado}\n\nProcesando su pedido...`);
        
        carritoServicio.limpiarCarrito();
        window.location.href = '/';
    });
}

