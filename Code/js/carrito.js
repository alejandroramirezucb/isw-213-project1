const productoServicio = new ProductoServicio();
const carritoServicio = new CarritoServicio();
const actualizadorContador = new ActualizadorContador(carritoServicio);

document.addEventListener('DOMContentLoaded', async () => {
    configurarEventosCheckout();
    await inicializarCarrito();
});

async function inicializarCarrito() {
    const contenedor = document.getElementById('lista-carrito');
    const carrito = carritoServicio.obtenerCarrito();

    if (carrito.length === 0) {
        mostrarCarritoVacio(contenedor);
        return;
    }

    const carritoActualizado = await verificarStockCarrito(carrito);
    renderizarProductosCarrito(contenedor, carritoActualizado);
    actualizarResumenCheckout();
    actualizadorContador.actualizar();
}

function mostrarCarritoVacio(contenedor) {
    contenedor.innerHTML = `
        <div class="carrito-vacio">
            <h3>Tu carrito está vacío</h3>
            <p>Agrega productos para comenzar a comprar</p>
            <a href="/" class="btn-primary">Ir a la tienda</a>
        </div>
    `;
    const resumen = document.getElementById('resumen-detalle');
    if (resumen) resumen.innerHTML = '';
    const totalPrecio = document.getElementById('total-precio');
    if (totalPrecio) totalPrecio.innerText = 'Bs. 0.00';
    
    document.querySelector('.carrito-checkout').style.opacity = '0.5';
    document.querySelector('.carrito-checkout').style.pointerEvents = 'none';
}

async function verificarStockCarrito(carrito) {
    const carritoActualizado = [];
    let huboCambios = false;

    for (const item of carrito) {
        try {
            const infoStock = await productoServicio.verificarStock(item.id);

            if (!infoStock.disponible || infoStock.stock === 0) {
                alert(`El producto "${item.nombre}" ya no está disponible.`);
                huboCambios = true;
                continue;
            }

            if (item.cantidad > infoStock.stock) {
                alert(`Ajustamos "${item.nombre}" a ${infoStock.stock} por falta de stock.`);
                item.cantidad = infoStock.stock;
                huboCambios = true;
            }

            item.stock = infoStock.stock;
            carritoActualizado.push(item);
        } catch (error) {
            carritoActualizado.push(item);
        }
    }

    if (huboCambios) carritoServicio.guardarCarrito(carritoActualizado);
    return carritoActualizado;
}

function renderizarProductosCarrito(contenedor, carrito) {
    contenedor.innerHTML = '';

    carrito.forEach((producto, indice) => {
        const subtotal = CalculadorPrecio.calcularSubtotal(producto.precio, producto.cantidad);
        const divItem = document.createElement('div');
        divItem.className = 'item-carrito';
        
        divItem.innerHTML = `
            <img src="${producto.imagen}" alt="${producto.nombre}">
            <div class="item-carrito__info">
                <div class="item-carrito__nombre">${producto.nombre}</div>
                <div class="item-carrito__precio">Bs. ${CalculadorPrecio.formatearPrecio(producto.precio)}</div>
                <div class="item-carrito__stock">Disponibles: ${producto.stock}</div>
                <div class="item-carrito__subtotal">Subtotal: Bs. ${subtotal}</div>
            </div>
            <div class="item-carrito__controles">
                <div class="cantidad-controles">
                    <button class="btn-cantidad" data-indice="${indice}" data-cambio="-1">-</button>
                    <input type="number" value="${producto.cantidad}" readonly>
                    <button class="btn-cantidad" data-indice="${indice}" data-cambio="1">+</button>
                </div>
                <button class="btn-eliminar" data-indice="${indice}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                    </svg>
                </button>
            </div>
        `;
        
        contenedor.appendChild(divItem);
    });

    adjuntarEventosItems();
}

function adjuntarEventosItems() {
    document.querySelectorAll('.btn-cantidad').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const indice = parseInt(e.currentTarget.dataset.indice);
            const cambio = parseInt(e.currentTarget.dataset.cambio);
            procesarCambioCantidad(indice, cambio);
        });
    });

    document.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const indice = parseInt(e.currentTarget.dataset.indice);
            procesarEliminacion(indice);
        });
    });
}

function actualizarResumenCheckout() {
    const resumenContenedor = document.getElementById('resumen-detalle');
    const cantidadTotal = carritoServicio.obtenerCantidadTotal();
    const precioTotal = carritoServicio.obtenerPrecioTotal();

    if (resumenContenedor) {
        resumenContenedor.innerHTML = `
            <div class="resumen-linea">
                <span>Productos (${cantidadTotal}):</span>
                <span>Bs. ${precioTotal.toFixed(2)}</span>
            </div>
            <div class="resumen-linea">
                <span>Envío:</span>
                <span id="costo-envio">Gratis</span>
            </div>
        `;
    }

    const elemTotal = document.getElementById('total-precio');
    if (elemTotal) elemTotal.innerText = `Bs. ${precioTotal.toFixed(2)}`;
}

async function procesarCambioCantidad(indice, cambio) {
    const carrito = carritoServicio.obtenerCarrito();
    const item = carrito[indice];
    const nuevaCantidad = item.cantidad + cambio;

    if (nuevaCantidad < 1) return;

    try {
        const infoStock = await productoServicio.verificarStock(item.id);
        if (nuevaCantidad > infoStock.stock) {
            alert(`Máximo disponible: ${infoStock.stock}`);
            return;
        }

        carritoServicio.actualizarCantidad(indice, nuevaCantidad);
        await inicializarCarrito();
    } catch (error) {
        console.error(error);
    }
}

function procesarEliminacion(indice) {
    if (confirm('¿Eliminar este producto?')) {
        carritoServicio.eliminarProducto(indice);
        inicializarCarrito();
    }
}

function configurarEventosCheckout() {
    const radiosEntrega = document.querySelectorAll('input[name="metodo-entrega"]');
    const campoDireccion = document.getElementById('campo-direccion');

    radiosEntrega.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'delivery') 
                campoDireccion.style.display = 'block';
            else 
                campoDireccion.style.display = 'none';
        });
    });

    const btnFinalizar = document.getElementById('btn-finalizar');
    if (btnFinalizar) {
        btnFinalizar.addEventListener('click', async () => {
            await finalizarCompra();
        });
    }
}

async function finalizarCompra() {
    const carrito = carritoServicio.obtenerCarrito();
    if (carrito.length === 0) return;

    const entrega = document.querySelector('input[name="metodo-entrega"]:checked').value;
    const pago = document.querySelector('input[name="metodo-pago"]:checked').value;
    const direccion = document.getElementById('direccion').value;

    if (entrega === 'delivery' && !direccion.trim()) {
        alert('Por favor, ingresa una dirección de entrega.');
        return;
    }

    const total = carritoServicio.obtenerPrecioTotal();
    alert(`¡Pago Exitoso!\n\nTotal: Bs. ${total.toFixed(2)}\nMétodo: ${pago}\nTipo: ${entrega}\n\nGracias por su preferencia.`);
    
    carritoServicio.limpiarCarrito();
    window.location.href = '/';
}

