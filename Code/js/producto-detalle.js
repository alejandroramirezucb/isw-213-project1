const productoServicio = new ProductoServicio();
const carritoServicio = new CarritoServicio();
const actualizadorContador = new ActualizadorContador(carritoServicio);

document.addEventListener('DOMContentLoaded', () => {
    const partesRuta = window.location.pathname.split('/');
    const idProducto = partesRuta[partesRuta.length - 1];
    if (idProducto)
        cargarDetalleProducto(idProducto);
});

async function cargarDetalleProducto(idProducto) {
    try {
        const producto = await productoServicio.obtenerPorId(idProducto);
        const contenedor = document.getElementById('detalle-producto');

        const urlImagen = producto.images && producto.images.length > 0 && producto.images[0].startsWith('http') 
            ? producto.images[0] 
            : 'https://resources.multicenter.com.bo/products/silla-gregor.jpg';

        const precio = producto.price || 0;
        const cuota = CalculadorPrecio.calcularCuotas(precio);
        const stock = producto.stock || 0;

        const htmlStock = stock > 0 
            ? `<p class="stock-disponible">Stock disponible: ${stock} unidades</p>`
            : `<p class="stock-agotado">Sin stock disponible</p>`;

        const htmlSelectorCantidad = stock > 0 ? `
            <div class="cantidad-selector">
                <label for="cantidad">Cantidad:</label>
                <div class="cantidad-controles">
                    <button id="btn-decrementar">-</button>
                    <input type="number" id="cantidad" value="1" min="1" max="${stock}">
                    <button id="btn-incrementar">+</button>
                </div>
            </div>
        ` : '';

        contenedor.innerHTML = `
            <div class="detalle-imagen">
                <img src="${urlImagen}" alt="${producto.name}">
            </div>
            <div class="detalle-info">
                <p class="detalle-info__marca">${producto.brand || 'Marca no disponible'}</p>
                <h1 class="detalle-info__nombre">${producto.name}</h1>
                
                <div class="detalle-info__precio-container">
                    <div class="detalle-info__precio">Bs. ${CalculadorPrecio.formatearPrecio(precio)}</div>
                    <p class="detalle-info__cuotas">12 cuotas sin interés de Bs. ${cuota}</p>
                </div>

                ${htmlStock}
                ${htmlSelectorCantidad}
                
                <button class="detalle-info__boton" id="btn-comprar" ${stock === 0 ? 'disabled' : ''}>
                    ${stock === 0 ? 'Sin Stock' : 'Agregar al Carrito'}
                </button>

                <div class="detalle-info__descripcion-container">
                    <h3>Descripción</h3>
                    <p class="detalle-info__descripcion">${producto.description || 'Sin descripción disponible.'}</p>
                </div>
            </div>
        `;

        if (stock > 0) {
            configurarControlesCantidad(stock);
            configurarBotonAgregar(producto, urlImagen);
        }

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('detalle-producto').innerHTML = 
            '<p class="mensaje-error">Error al cargar el producto.</p>';
    }
}

function configurarControlesCantidad(stockMaximo) {
    const inputCantidad = document.getElementById('cantidad');
    const btnIncrementar = document.getElementById('btn-incrementar');
    const btnDecrementar = document.getElementById('btn-decrementar');
    
    if (btnIncrementar) {
        btnIncrementar.addEventListener('click', () => {
            const valorActual = parseInt(inputCantidad.value);
            if (valorActual < stockMaximo)
                inputCantidad.value = valorActual + 1;
        });
    }

    if (btnDecrementar) {
        btnDecrementar.addEventListener('click', () => {
            const valorActual = parseInt(inputCantidad.value);
            if (valorActual > 1)
                inputCantidad.value = valorActual - 1;
        });
    }

    if (inputCantidad) {
        inputCantidad.addEventListener('change', function() {
            let valor = parseInt(this.value);
            if (isNaN(valor) || valor < 1)
                this.value = 1;
            else if (valor > stockMaximo) {
                this.value = stockMaximo;
                alert(`Solo hay ${stockMaximo} unidades disponibles.`);
            }
        });
    }
}

function configurarBotonAgregar(producto, urlImagen) {
    const btnComprar = document.getElementById('btn-comprar');
    if (btnComprar) {
        btnComprar.addEventListener('click', async () => {
            const inputCantidad = document.getElementById('cantidad');
            const cantidad = parseInt(inputCantidad?.value) || 1;
            await agregarProductoAlCarrito(producto, urlImagen, cantidad);
        });
    }
}

async function agregarProductoAlCarrito(producto, urlImagen, cantidad) {
    try {
        const infoStock = await productoServicio.verificarStock(producto.id);
        
        if (!infoStock.disponible || infoStock.stock === 0) {
            alert('Lo sentimos, este producto no está disponible en stock.');
            location.reload();
            return;
        }

        const carrito = carritoServicio.obtenerCarrito();
        const itemExistente = carrito.find(item => item.id === producto.id);

        if (itemExistente) {
            const cantidadNueva = itemExistente.cantidad + cantidad;
            
            if (cantidadNueva > infoStock.stock) {
                alert(`Solo hay ${infoStock.stock} unidades disponibles. Ya tienes ${itemExistente.cantidad} en el carrito.`);
                return;
            }
        } else {
            if (cantidad > infoStock.stock) {
                alert(`Solo hay ${infoStock.stock} unidades disponibles.`);
                return;
            }
        }

        const productoParaCarrito = {
            id: producto.id,
            nombre: producto.name,
            precio: producto.price,
            imagen: urlImagen,
            stock: infoStock.stock
        };

        carritoServicio.agregarProducto(productoParaCarrito, cantidad);
        
        mostrarNotificacionExito(producto.name, cantidad);
        actualizadorContador.actualizar();
        
    } catch (error) {
        console.error('Error al agregar al carrito:', error);
        alert('Error al agregar el producto al carrito. Por favor, intente nuevamente.');
    }
}

function mostrarNotificacionExito(nombreProducto, cantidad) {
    const notificacion = document.getElementById('notificacion-carrito');
    if (!notificacion) return;

    const total = carritoServicio.obtenerPrecioTotal();
    const totalItems = carritoServicio.obtenerCantidadTotal();

    notificacion.innerHTML = `
        <h4>¡Añadido con Éxito!</h4>
        <p>Has agregado <strong>${cantidad}</strong> x ${nombreProducto}.</p>
        <p>Tienes ${totalItems} productos en total.</p>
        <div class="total">Total: Bs. ${total.toFixed(2)}</div>
        <a href="/carrito" class="btn-primary" style="display:block; margin-top:15px; text-align:center; padding:10px; font-size:14px; text-decoration:none; color:white; border-radius:20px;">Ver mi Carrito</a>
    `;

    notificacion.style.display = 'block';

    setTimeout(() => {
        notificacion.style.display = 'none';
    }, 4000);
}

