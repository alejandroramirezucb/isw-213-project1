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
        showToast(
          `El producto "${item.nombre}" ya no está disponible y será eliminado del carrito.`,
          { type: 'warning', duration: 6000 },
        );
        huboCambios = true;
        continue;
      }

      if (item.cantidad > infoStock.stock) {
        showToast(
          `El producto "${item.nombre}" tiene menos stock del que solicitaste. Se ajustó a ${infoStock.stock} unidades.`,
          { type: 'warning', duration: 6000 },
        );
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

  if (huboCambios) carritoServicio.guardarCarrito(carritoActualizado);

  return carritoActualizado;
}

function renderizarProductosCarrito(contenedor, carrito) {
  contenedor.innerHTML = '';

  carrito.forEach((producto, indice) => {
    const subtotal = CalculadorPrecio.calcularSubtotal(
      producto.precio,
      producto.cantidad,
    );
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
  const cantidadTotal = carrito.reduce(
    (total, item) => total + item.cantidad,
    0,
  );
  const precioTotal = carritoServicio.obtenerPrecioTotal();

  const contenedorTotal =
    document.querySelector('.total-final') ||
    (elementoTotal && elementoTotal.parentElement);
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
  } else if (elementoTotal) {
    elementoTotal.innerText = `Bs. ${precioTotal.toFixed(2)}`;
  }
}

async function cambiarCantidad(indice, cambio) {
  const carrito = carritoServicio.obtenerCarrito();

  if (indice < 0 || indice >= carrito.length) return;

  const item = carrito[indice];
  const cantidadNueva = item.cantidad + cambio;

  if (cantidadNueva < 1) {
    const confirmar = await showConfirm(
      '¿Deseas eliminar este producto del carrito?',
      { confirmText: 'Eliminar', cancelText: 'Cancelar' },
    );
    if (confirmar) await eliminarProducto(indice);
    return;
  }

  try {
    const infoStock = await productoServicio.verificarStock(item.id);

    if (!infoStock.disponible || infoStock.stock === 0) {
      showToast('Este producto ya no está disponible.', { type: 'warning' });
      await eliminarProducto(indice);
      return;
    }

    if (cantidadNueva > infoStock.stock) {
      showToast(`Solo hay ${infoStock.stock} unidades disponibles.`, {
        type: 'warning',
      });
      return;
    }

    carritoServicio.actualizarCantidad(indice, cantidadNueva);
    await mostrarCarrito();
  } catch (error) {
    console.error('Error al verificar stock:', error);
    showToast(
      'Error al actualizar la cantidad. Por favor, intente nuevamente.',
      { type: 'error' },
    );
  }
}

async function actualizarCantidad(indice, nuevaCantidadStr) {
  const nuevaCantidad = parseInt(nuevaCantidadStr);

  if (isNaN(nuevaCantidad) || nuevaCantidad < 1) {
    showToast('La cantidad debe ser al menos 1.', { type: 'warning' });
    await mostrarCarrito();
    return;
  }

  const carrito = carritoServicio.obtenerCarrito();

  if (indice < 0 || indice >= carrito.length) return;

  const item = carrito[indice];

  try {
    const infoStock = await productoServicio.verificarStock(item.id);

    if (!infoStock.disponible || infoStock.stock === 0) {
      showToast('Este producto ya no está disponible.', { type: 'warning' });
      await eliminarProducto(indice);
      return;
    }

    if (nuevaCantidad > infoStock.stock) {
      showToast(`Solo hay ${infoStock.stock} unidades disponibles.`, {
        type: 'warning',
      });
      await mostrarCarrito();
      return;
    }

    carritoServicio.actualizarCantidad(indice, nuevaCantidad);
    await mostrarCarrito();
  } catch (error) {
    console.error('Error al verificar stock:', error);
    showToast(
      'Error al actualizar la cantidad. Por favor, intente nuevamente.',
      { type: 'error' },
    );
    await mostrarCarrito();
  }
}

async function eliminarProducto(indice) {
  const carrito = carritoServicio.obtenerCarrito();
  const producto = carrito[indice];

  const confirmado = await showConfirm(
    `¿Estás seguro de eliminar "${producto.nombre}" del carrito?`,
    { confirmText: 'Eliminar', cancelText: 'Cancelar' },
  );
  if (confirmado) {
    carritoServicio.eliminarProducto(indice);
    await mostrarCarrito();
  }
}

function configurarBotonFinalizar() {
  const btnFinalizar = document.getElementById('btn-finalizar');
  if (!btnFinalizar) return;

  btnFinalizar.addEventListener('click', async () => {
    if (!window.supabase || !window.supabaseClient) {
      window.location.href = '/login';
      return;
    }

    try {
      const {
        data: { session },
      } = await window.supabaseClient.auth.getSession();
      if (!session) {
        window.location.href = '/login';
        return;
      }
    } catch (e) {
      window.location.href = '/login';
      return;
    }

    await finalizarCompra();
  });
}

async function finalizarCompra() {
  if (!window.supabase || !supabase) {
    window.location.href = '/login';
    return;
  }

  try {
    const {
      data: { session },
    } = await window.supabaseClient.auth.getSession();
    if (!session) {
      window.location.href = '/login';
      return;
    }

    const carrito = carritoServicio.obtenerCarrito();
    if (!carrito || carrito.length === 0) {
      showToast('El carrito está vacío.', { type: 'info' });
      return;
    }

    const carritoActualizado = await verificarStockCarrito(carrito);
    if (!carritoActualizado || carritoActualizado.length === 0) {
      showToast('No hay productos disponibles en el carrito.', {
        type: 'warning',
      });
      return;
    }

    const entregaNode = document.querySelector(
      'input[name="metodo-entrega"]:checked',
    );
    const pagoNode = document.querySelector(
      'input[name="metodo-pago"]:checked',
    );
    const direccion =
      (document.getElementById('direccion') || {}).value || null;

    const entrega = entregaNode ? entregaNode.value : 'recojo_almacen';
    const pago = pagoNode ? pagoNode.value : 'efectivo';

    if (entrega === 'delivery' && (!direccion || !direccion.trim())) {
      showToast('Por favor ingresa la dirección de entrega.', {
        type: 'warning',
      });
      return;
    }

    const total = carritoServicio.obtenerPrecioTotal();

    const { data: pedido, error: errorPedido } = await supabase
      .from('pedidos')
      .insert({
        usuario_id: session.user.id,
        monto_total: total,
        metodo_entrega: entrega,
        direccion_destino: direccion,
        estado: 'recibido',
      })
      .select()
      .single();

    if (errorPedido) throw errorPedido;

    const detalles = carritoActualizado.map((item) => ({
      pedido_id: pedido.id,
      producto_id: item.id,
      cantidad: item.cantidad,
      precio_unitario_venta: item.precio,
    }));

    const { error: errorDetalles } = await supabase
      .from('detalles_pedido')
      .insert(detalles);
    if (errorDetalles) throw errorDetalles;

    const { error: errorPago } = await window.supabaseClient
      .from('pagos')
      .insert({
        pedido_id: pedido.id,
        metodo_pago: pago,
        estado_pago: 'pendiente',
        monto_total_pagado: total,
      });
    if (errorPago) throw errorPago;

    carritoServicio.limpiarCarrito();
    window.location.href = '/perfil';
  } catch (err) {
    console.error('Error finalizarCompra:', err);
    showToast('Error al procesar pedido. Intente nuevamente.', {
      type: 'error',
    });
  }
}
