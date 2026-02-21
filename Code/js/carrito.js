const productoServicio = new ProductoServicio();
const carritoServicio = new CarritoServicio();
const actualizadorContador = new ActualizadorContador(carritoServicio);

let supa = null;
let stockVerificadoEnSesion = false; 

async function inicializarSupabase() {
  try {
    const res = await fetch('/config');
    if (!res.ok) return false;
    const { supabaseUrl, supabaseKey } = await res.json();
    if (!supabaseUrl || !supabaseKey || !window.supabase) return false;
    supa = window.supabase.createClient(supabaseUrl, supabaseKey);
    return true;
  } catch {
    return false;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await inicializarSupabase();
  await mostrarCarrito();
  configurarBotonFinalizar();
  configurarEventosPago();
});

function configurarEventosPago() {
  const btnCerrar = document.getElementById('btn-cerrar-modal');
  if (btnCerrar) {
    btnCerrar.onclick = () => {
      document.getElementById('modal-pago').style.display = 'none';
    };
  }

  const formTarjeta = document.getElementById('form-tarjeta');
  if (formTarjeta) {
    formTarjeta.onsubmit = async (e) => {
      e.preventDefault();
      formTarjeta.style.display = 'none';
      const areaEstado = document.getElementById('estado-tarjeta');
      if (areaEstado) areaEstado.style.display = 'block';

      setTimeout(async () => {
        await realizarPedidoFinal('pagado');
        document.getElementById('modal-pago').style.display = 'none';
      }, 2500);
    };
  }
}

async function mostrarCarrito() {
  const contenedor = document.getElementById('lista-carrito');
  const elementoTotal = document.getElementById('total-precio');
  const carrito = carritoServicio.obtenerCarrito();

  if (carrito.length === 0) {
    mostrarCarritoVacio(contenedor, elementoTotal);
    return;
  }

  let carritoActualizado = carrito;
  if (!stockVerificadoEnSesion) {
    carritoActualizado = await verificarStockCarrito(carrito);
    stockVerificadoEnSesion = true;
  }

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

  const stockActual = item.stock || 999;
  
  if (cantidadNueva > stockActual) {
    showToast(`Solo hay ${stockActual} unidades disponibles.`, {
      type: 'warning',
    });
    return;
  }

  carritoServicio.actualizarCantidad(indice, cantidadNueva);
  
  const contenedor = document.getElementById('lista-carrito');
  const elementoTotal = document.getElementById('total-precio');
  const carritoActualizado = carritoServicio.obtenerCarrito();
  renderizarProductosCarrito(contenedor, carritoActualizado);
  actualizarTotalCarrito(elementoTotal, carritoActualizado);
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

  // Validar contra el stock que ya tenemos (sin hacer fetch)
  const stockActual = item.stock || 999;

  if (nuevaCantidad > stockActual) {
    showToast(`Solo hay ${stockActual} unidades disponibles.`, {
      type: 'warning',
    });
    await mostrarCarrito();
    return;
  }

  carritoServicio.actualizarCantidad(indice, nuevaCantidad);
  
  const contenedor = document.getElementById('lista-carrito');
  const elementoTotal = document.getElementById('total-precio');
  const carritoActualizado = carritoServicio.obtenerCarrito();
  renderizarProductosCarrito(contenedor, carritoActualizado);
  actualizarTotalCarrito(elementoTotal, carritoActualizado);
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
    if (!supa) {
      window.location.href = '/login';
      return;
    }

    try {
      const {
        data: { session },
      } = await supa.auth.getSession();
      if (!session) {
        window.location.href = '/login';
        return;
      }
    } catch {
      window.location.href = '/login';
      return;
    }

    await finalizarCompra();
  });
}

async function finalizarCompra() {
  try {
    const {
      data: { session },
    } = await supa.auth.getSession();
    if (!session) {
      window.location.href = '/login';
      return;
    }

    const carrito = carritoServicio.obtenerCarrito();
    if (!carrito || carrito.length === 0) {
      showToast('El carrito está vacío.', { type: 'info' });
      return;
    }

    // El stock ya fue verificado al cargar la página
    if (!stockVerificadoEnSesion) {
      const carritoActualizado = await verificarStockCarrito(carrito);
      if (!carritoActualizado || carritoActualizado.length === 0) {
        showToast('No hay productos disponibles en el carrito.', {
          type: 'warning',
        });
        return;
      }
    } else {
      // Usar el carrito tal como está
      if (carrito.length === 0) {
        showToast('No hay productos disponibles en el carrito.', {
          type: 'warning',
        });
        return;
      }
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

    if (pago === 'efectivo') {
      await realizarPedidoFinal('pendiente');
    } else if (pago === 'tarjeta') {
      const modal = document.getElementById('modal-pago');
      document.getElementById('pago-qr').style.display = 'none';
      document.getElementById('pago-tarjeta').style.display = 'block';
      document.getElementById('monto-tarjeta').innerText =
        `Bs. ${total.toFixed(2)}`;
      document.getElementById('form-tarjeta').style.display = 'block';
      document.getElementById('estado-tarjeta').style.display = 'none';
      modal.style.display = 'block';
    } else if (pago === 'qr') {
      const modal = document.getElementById('modal-pago');
      document.getElementById('pago-tarjeta').style.display = 'none';
      document.getElementById('pago-qr').style.display = 'block';
      document.getElementById('monto-qr').innerText = `Bs. ${total.toFixed(2)}`;
      document.getElementById('texto-estado-qr').innerText =
        'Esperando confirmación del banco...';
      const qrImg = document.getElementById('qr-img');
      if (qrImg) {
        const qrData = encodeURIComponent(
          `Raidencenter|Monto:${total.toFixed(2)}|Bs`,
        );
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`;
      }
      modal.style.display = 'block';

      setTimeout(async () => {
        document.getElementById('texto-estado-qr').innerText =
          '¡Pago confirmado por el banco!';
        setTimeout(async () => {
          await realizarPedidoFinal('pagado');
          modal.style.display = 'none';
        }, 1200);
      }, 4000);
    }
  } catch (err) {
    console.error('Error finalizarCompra:', err);
    showToast('Error al iniciar pedido.', { type: 'error' });
  }
}

async function realizarPedidoFinal(estadoPago) {
  try {
    const {
      data: { session },
    } = await supa.auth.getSession();
    const carrito = carritoServicio.obtenerCarrito();
    const total = carritoServicio.obtenerPrecioTotal();
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

    const payload = {
      usuario_id: session.user.id,
      monto_total: total,
      metodo_entrega: entrega,
      direccion_destino: direccion,
      detalles: carrito.map((item) => ({
        producto_id: item.id,
        cantidad: item.cantidad,
        precio_unitario_venta: item.precio,
      })),
      pago: {
        metodo_pago: pago,
        estado_pago: estadoPago,
        es_en_cuotas: false,
        cantidad_cuotas: 1,
        monto_total_pagado: total,
      },
    };

    const res = await fetch('/api/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || res.statusText);
    }

    carritoServicio.limpiarCarrito();
    showToast('¡Compra realizada con éxito!', { type: 'success' });
    setTimeout(() => {
      window.location.href = '/historial';
    }, 1200);
  } catch (err) {
    console.error('Error realizarPedidoFinal:', err);
    showToast('Error al procesar el pedido final: ' + err.message, {
      type: 'error',
    });
  }
}
