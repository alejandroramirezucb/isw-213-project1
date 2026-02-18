let supa = null;

async function inicializarSupabase() {
  const res = await fetch('/config');
  const { supabaseUrl, supabaseKey } = await res.json();
  supa = window.supabase.createClient(supabaseUrl, supabaseKey);
}

document.addEventListener('DOMContentLoaded', async () => {
  await inicializarSupabase();

  const {
    data: { session },
  } = await supa.auth.getSession();

  if (!session) {
    showToast('Debes iniciar sesión para ver tu historial de compras.', {
      type: 'info',
      duration: 1000,
    });
    setTimeout(() => (window.location.href = '/login'), 600);
    return;
  }

  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  await cargarHistorial(session.user.id);
  configurarFiltros(session.user.id);
});

async function cargarHistorial(userId, filtros = {}) {
  const contenedor = document.getElementById('lista-pedidos-historial');
  contenedor.innerHTML =
    '<div class="mensaje-vacio"><h3>Cargando pedidos...</h3></div>';

  try {
    let query = supa
      .from('pedidos')
      .select('*')
      .eq('usuario_id', userId)
      .order('fecha_creacion', { ascending: false });

    if (filtros.estado) query = query.eq('estado', filtros.estado);
    if (filtros.fechaDesde)
      query = query.gte('fecha_creacion', filtros.fechaDesde);
    if (filtros.fechaHasta)
      query = query.lte('fecha_creacion', filtros.fechaHasta + 'T23:59:59');

    const { data: pedidos, error } = await query;

    if (error) {
      console.error('Error al cargar pedidos:', error);
      contenedor.innerHTML =
        '<div class="mensaje-vacio"><h3>Error al cargar el historial</h3></div>';
      return;
    }

    if (!pedidos || pedidos.length === 0) {
      contenedor.innerHTML =
        '<div class="mensaje-vacio"><h3>No tienes pedidos registrados</h3></div>';
      return;
    }

    const pedidoIds = pedidos.map((p) => p.id);

    const [{ data: detalles }, { data: pagos }] = await Promise.all([
      supa
        .from('detalles_pedido')
        .select('*, productos(id, nombre, url_imagen)')
        .in('pedido_id', pedidoIds),
      supa.from('pagos').select('*').in('pedido_id', pedidoIds),
    ]);

    let cronogramas = [];
    if (pagos && pagos.length > 0) {
      const pagoIds = pagos.map((p) => p.id);
      const { data: cron } = await supa
        .from('cronograma_cuotas')
        .select('*')
        .in('pago_id', pagoIds);
      cronogramas = cron || [];
    }

    pedidos.forEach((pedido) => {
      pedido.detalles_pedido = (detalles || []).filter(
        (d) => d.pedido_id === pedido.id,
      );
      const pedidoPagos = (pagos || []).filter(
        (p) => p.pedido_id === pedido.id,
      );
      pedido.pagos = pedidoPagos.map((pago) => ({
        ...pago,
        cronograma_cuotas: cronogramas.filter((c) => c.pago_id === pago.id),
      }));
    });

    contenedor.innerHTML = '';
    pedidos.forEach((pedido) => {
      const card = crearPedidoCard(pedido);
      contenedor.appendChild(card);
    });

    suscribirseACambiosPedidos(userId);
  } catch (error) {
    console.error('Error:', error);
    contenedor.innerHTML =
      '<div class="mensaje-vacio"><h3>Error al cargar el historial</h3></div>';
  }
}

function suscribirseACambiosPedidos(userId) {
  supa
    .channel('cambios-pedidos')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'pedidos',
        filter: `usuario_id=eq.${userId}`,
      },
      (payload) => {
        console.log('Cambio detectado en pedido:', payload.new);
        showToast(
          `Tu pedido #${payload.new.id} ha cambiado de estado a: ${payload.new.estado}`,
          { type: 'info', duration: 5000 },
        );

        const filtros = {
          estado: document.getElementById('filtro-estado').value,
          fechaDesde: document.getElementById('filtro-fecha-desde').value,
          fechaHasta: document.getElementById('filtro-fecha-hasta').value,
        };
        cargarHistorial(userId, filtros);

        if (payload.new.estado === 'listo para entregarse') {
          enviarNotificacionNavegador(payload.new);
        }
      },
    )
    .subscribe();
}

function enviarNotificacionNavegador(pedido) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('¡Pedido Listo!', {
      body: `Tu pedido #${pedido.id} está listo para ser ${pedido.metodo_entrega === 'delivery' ? 'entregado' : 'recogido'}.`,
      icon: '/assets/icon.png',
    });
  }
}

function getEstadoLabel(estado) {
  if (!estado) return '';
  if (estado === 'recibido') return 'Orden realizada';
  return estado.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function crearPedidoCard(pedido) {
  const div = document.createElement('div');
  div.className = 'pedido-card';

  const fecha = new Date(pedido.fecha_creacion).toLocaleDateString('es-BO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const estadoClass =
    'estado-' + pedido.estado.replace(/ /g, '-').toLowerCase();
  const pago = pedido.pagos && pedido.pagos.length > 0 ? pedido.pagos[0] : null;
  const pagoHTML = pago ? generarInfoPago(pago) : '';
  const productosHTML =
    pedido.detalles_pedido && pedido.detalles_pedido.length > 0
      ? generarListaProductos(pedido.detalles_pedido)
      : '<p style="color: #888; font-size: 14px;">Sin detalles de productos</p>';
  const lineaTiempoHTML = generarLineaTiempo(pedido);

  div.innerHTML = `
        <div class="pedido-header">
            <div>
                <div class="pedido-numero">Pedido #${pedido.id}</div>
                <div class="pedido-fecha">${fecha}</div>
            </div>
            <div class="pedido-estado ${estadoClass}">${getEstadoLabel(pedido.estado)}</div>
        </div>
        ${lineaTiempoHTML}
        <div class="pedido-detalles">
            <div class="detalle-linea">
                <span class="detalle-label">Método de entrega:</span>
                <span class="detalle-valor">${pedido.metodo_entrega === 'delivery' ? 'Delivery' : 'Recojo en Almacén'}</span>
            </div>
            ${pedido.direccion_destino ? `<div class="detalle-linea"><span class="detalle-label">Dirección:</span><span class="detalle-valor">${pedido.direccion_destino}</span></div>` : ''}
            <div class="detalle-linea">
                <span class="detalle-label">Monto total:</span>
                <span class="detalle-valor" style="color: #034e8b; font-size: 18px; font-weight: bold;">Bs. ${pedido.monto_total.toFixed(2)}</span>
            </div>
        </div>
        <div class="pedido-productos">
            <strong style="display: block; margin-bottom: 10px;">Productos:</strong>
            ${productosHTML}
        </div>
        ${pagoHTML}
        <div class="pedido-acciones">
            <button class="btn-accion btn-factura" onclick="descargarFactura(${pedido.id})" ${pago && pago.estado_pago === 'pagado' ? '' : 'disabled'}>
                ${pago && pago.estado_pago === 'pagado' ? 'Descargar Factura' : 'Factura no disponible'}
            </button>
        </div>
    `;

  return div;
}

function generarListaProductos(detalles) {
  return detalles
    .map((detalle) => {
      const producto = detalle.productos;
      return `<div class="producto-item"><span>${producto ? producto.nombre : 'Producto no disponible'} x ${detalle.cantidad}</span><span style="font-weight: 500;">Bs. ${(detalle.precio_unitario_venta * detalle.cantidad).toFixed(2)}</span></div>`;
    })
    .join('');
}

function generarLineaTiempo(pedido) {
  const estadosPosibles = [
    'recibido',
    'en proceso',
    'enviado',
    'trasladandose',
    'listo para entregarse',
    'entregado',
  ];
  const estadoActual = pedido.estado.toLowerCase();

  let html =
    '<div class="linea-tiempo"><div class="linea-tiempo-titulo">Seguimiento del Pedido</div>';

  estadosPosibles.forEach((estado) => {
    const indiceEstado = estadosPosibles.indexOf(estado);
    const indiceActual = estadosPosibles.indexOf(estadoActual);
    const activo = indiceEstado <= indiceActual ? 'estado-activo' : '';
    const fechaFormateada =
      activo && estado === estadoActual
        ? new Date(pedido.fecha_creacion).toLocaleDateString('es-BO', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })
        : activo
          ? 'Completado'
          : 'Pendiente';

    html += `
            <div class="estado-timeline ${activo}">
                <div class="estado-punto"></div>
                <div class="estado-nombre">${getEstadoLabel(estado)}</div>
                <div class="estado-fecha">${fechaFormateada}</div>
            </div>
        `;
  });

  html += '</div>';

  return html;
}

function generarInfoPago(pago) {
  let contenido = `<div class="info-pago"><div class="info-pago-titulo">Información de Pago</div><div class="detalle-linea"><span class="detalle-label">Método:</span><span class="detalle-valor">${pago.metodo_pago.toUpperCase()}</span></div><div class="detalle-linea"><span class="detalle-label">Estado:</span><span class="detalle-valor" style="color: ${pago.estado_pago === 'pagado' ? '#388e3c' : '#f57c00'};">${pago.estado_pago === 'pagado' ? 'Pagado' : pago.estado_pago === 'pendiente' ? 'Pendiente' : 'Fallido'}</span></div>`;

  if (
    pago.es_en_cuotas &&
    pago.cronograma_cuotas &&
    pago.cronograma_cuotas.length > 0
  ) {
    contenido += `<div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd;"><strong style="display: block; margin-bottom: 8px;">Plan de Cuotas (${pago.cantidad_cuotas} cuotas):</strong>`;
    pago.cronograma_cuotas.forEach((cuota) => {
      const estadoClass =
        cuota.estado_cuota === 'pagado' ? 'cuota-pagada' : 'cuota-pendiente';
      const fechaVenc = new Date(cuota.fecha_vencimiento).toLocaleDateString(
        'es-BO',
      );
      contenido += `<div class="cuota-item ${estadoClass}"><span>Cuota ${cuota.numero_cuota} - ${fechaVenc}</span><span>Bs. ${cuota.monto_cuota.toFixed(2)} - ${cuota.estado_cuota === 'pagado' ? '✓ Pagado' : '⏱ Pendiente'}</span></div>`;
    });
    contenido += `</div>`;
  }

  contenido += `</div>`;
  return contenido;
}

function configurarFiltros(userId) {
  document
    .getElementById('btn-aplicar-filtros')
    .addEventListener('click', () => {
      const filtros = {
        estado: document.getElementById('filtro-estado').value,
        fechaDesde: document.getElementById('filtro-fecha-desde').value,
        fechaHasta: document.getElementById('filtro-fecha-hasta').value,
      };
      cargarHistorial(userId, filtros);
    });
}

async function descargarFactura(pedidoId) {
  try {
    const { data: pedido, error: errPedido } = await supa
      .from('pedidos')
      .select('*')
      .eq('id', pedidoId)
      .single();
    if (errPedido) throw errPedido;

    const [{ data: usuarioData }, { data: detallesData }, { data: pagosData }] =
      await Promise.all([
        supa
          .from('usuarios')
          .select('nombre_completo, correo_electronico')
          .eq('id', pedido.usuario_id)
          .single(),
        supa
          .from('detalles_pedido')
          .select('cantidad, precio_unitario_venta, productos(nombre)')
          .eq('pedido_id', pedidoId),
        supa
          .from('pagos')
          .select('metodo_pago, estado_pago, referencia_transaccion')
          .eq('pedido_id', pedidoId),
      ]);

    pedido.usuarios = usuarioData || {};
    pedido.detalles_pedido = detallesData || [];
    pedido.pagos = pagosData || [];

    generarPDFFactura(pedido);
  } catch (error) {
    console.error('Error:', error);
    showToast('Error al generar la factura.', { type: 'error' });
  }
}

function generarPDFFactura(pedido) {
  const usuario = pedido.usuarios;
  const pago = pedido.pagos && pedido.pagos.length > 0 ? pedido.pagos[0] : null;
  const fecha = new Date(pedido.fecha_creacion).toLocaleDateString('es-BO');

  let productos = '';
  pedido.detalles_pedido.forEach((detalle) => {
    const subtotal = detalle.cantidad * detalle.precio_unitario_venta;
    productos += `<tr><td>${detalle.productos.nombre}</td><td>${detalle.cantidad}</td><td>Bs. ${detalle.precio_unitario_venta.toFixed(2)}</td><td>Bs. ${subtotal.toFixed(2)}</td></tr>`;
  });

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Factura #${pedido.id}</title><style>body{font-family:Arial;padding:40px;color:#333}.header{text-align:center;margin-bottom:40px;border-bottom:3px solid #034e8b;padding-bottom:20px}.header h1{color:#034e8b;margin:0}.info-section{margin:30px 0}.info-row{display:flex;justify-content:space-between;margin:10px 0}.info-label{font-weight:bold;color:#666}.tabla-productos{width:100%;border-collapse:collapse;margin:30px 0}.tabla-productos th{background:#034e8b;color:white;padding:12px;text-align:left}.tabla-productos td{border:1px solid #ddd;padding:10px}.total{text-align:right;margin-top:30px;font-size:20px;font-weight:bold;color:#034e8b}.footer{margin-top:50px;text-align:center;color:#888;font-size:12px}</style></head><body><div class="header"><h1>RAIDENCENTER</h1><p>Factura de Compra</p></div><div class="info-section"><h3>Información del Cliente</h3><div class="info-row"><span class="info-label">Nombre:</span><span>${usuario.nombre_completo}</span></div><div class="info-row"><span class="info-label">Correo:</span><span>${usuario.correo_electronico}</span></div></div><div class="info-section"><h3>Información del Pedido</h3><div class="info-row"><span class="info-label">Número de Pedido:</span><span>#${pedido.id}</span></div><div class="info-row"><span class="info-label">Fecha:</span><span>${fecha}</span></div><div class="info-row"><span class="info-label">Método de Entrega:</span><span>${pedido.metodo_entrega === 'delivery' ? 'Delivery' : 'Recojo en Almacén'}</span></div>${pedido.direccion_destino ? `<div class="info-row"><span class="info-label">Dirección:</span><span>${pedido.direccion_destino}</span></div>` : ''}<div class="info-row"><span class="info-label">Método de Pago:</span><span>${pago ? pago.metodo_pago.toUpperCase() : 'N/A'}</span></div></div><h3>Detalle de Productos</h3><table class="tabla-productos"><thead><tr><th>Producto</th><th>Cantidad</th><th>Precio Unitario</th><th>Subtotal</th></tr></thead><tbody>${productos}</tbody></table><div class="total">TOTAL: Bs. ${pedido.monto_total.toFixed(2)}</div><div class="footer"><p>Gracias por su compra en Raidencenter</p></div></body></html>`;

  const ventana = window.open('', '', 'width=800,height=600');
  ventana.document.write(html);
  ventana.document.close();
  ventana.focus();
  setTimeout(() => ventana.print(), 250);
}
