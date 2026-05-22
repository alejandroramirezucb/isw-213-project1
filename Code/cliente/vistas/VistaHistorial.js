class VistaHistorial {
  static ESTADOS_DELIVERY = ['orden realizada', 'en proceso', 'enviado', 'trasladandose', 'listo para entregarse', 'entregado'];
  static ESTADOS_RECOJO = ['orden realizada', 'en proceso', 'listo para entregarse', 'entregado'];
  static NOMBRES_ESTADOS = {
    'orden realizada': 'Orden Realizada', recibido: 'Recibido', 'en proceso': 'En Proceso',
    enviado: 'Enviado', trasladandose: 'Trasladándose', 'listo para entregarse': 'Listo para Entregarse', entregado: 'Entregado',
  };

  constructor() {
    document.addEventListener('pedido:historialCargado', (e) => this._renderizar(e.detail.pedidos));
  }

  _renderizar(pedidos) {
    const contenedor = document.querySelector('.pedidos__lista');
    if (!contenedor) return;

    while (contenedor.firstChild) contenedor.removeChild(contenedor.firstChild);

    if (pedidos.length === 0) {
      const mensaje = document.createElement('p');
      mensaje.className = 'pedidos__mensaje-vacio';
      mensaje.textContent = 'No tienes pedidos registrados';
      contenedor.appendChild(mensaje);
      return;
    }

    pedidos.forEach((pedido) => contenedor.appendChild(this._crearTarjeta(pedido)));
  }

  _crearTarjeta(pedido) {
    const articulo = document.createElement('article');
    articulo.className = 'pedido-tarjeta';
    articulo.id = `pedido-tarjeta-${pedido.id}`;

    const cabecera = document.createElement('div');
    cabecera.className = 'pedido-tarjeta__cabecera';

    const infoDiv = document.createElement('div');
    infoDiv.className = 'pedido-tarjeta__info';

    const numeroPedido = document.createElement('span');
    numeroPedido.className = 'pedido-tarjeta__numero';
    numeroPedido.textContent = `Pedido #${pedido.id}`;
    infoDiv.appendChild(numeroPedido);

    const fechaPedido = document.createElement('span');
    fechaPedido.className = 'pedido-tarjeta__fecha';
    fechaPedido.textContent = new Date(pedido.fecha_creacion).toLocaleDateString('es-BO', { year: 'numeric', month: 'long', day: 'numeric' });
    infoDiv.appendChild(fechaPedido);
    cabecera.appendChild(infoDiv);

    const divDerecho = document.createElement('div');
    divDerecho.className = 'pedido-tarjeta__cabecera-derecho';

    const claseEstadoMod = (pedido.estado || '').replace(/\s+/g, '-');
    const estadoBadge = document.createElement('span');
    estadoBadge.className = `pedido-tarjeta__estado-badge pedido-tarjeta__estado-badge--${claseEstadoMod}`;
    estadoBadge.textContent = this._etiquetaEstado(pedido.estado) || 'Orden Realizada';
    divDerecho.appendChild(estadoBadge);

    const flecha = document.createElement('span');
    flecha.className = 'pedido-tarjeta__flecha';
    flecha.textContent = '▼';
    divDerecho.appendChild(flecha);
    cabecera.appendChild(divDerecho);

    const cuerpo = document.createElement('div');
    cuerpo.className = 'pedido-tarjeta__cuerpo';

    cabecera.addEventListener('click', () => {
      cuerpo.classList.toggle('pedido-tarjeta__cuerpo--visible');
      flecha.classList.toggle('pedido-tarjeta__flecha--abierto', cuerpo.classList.contains('pedido-tarjeta__cuerpo--visible'));
    });

    const detallesDiv = document.createElement('div');
    detallesDiv.className = 'pedido-tarjeta__detalles';
    const cantidadProductos = (pedido.detalles || []).reduce((s, d) => s + d.cantidad, 0);

    const pCantidad = document.createElement('span');
    pCantidad.textContent = `${cantidadProductos} producto(s)`;
    detallesDiv.appendChild(pCantidad);

    const pMetodo = document.createElement('span');
    pMetodo.textContent = pedido.metodo_entrega === 'delivery' ? 'Delivery' : 'Recojo en almacén';
    detallesDiv.appendChild(pMetodo);

    const pTotal = document.createElement('span');
    pTotal.className = 'pedido-tarjeta__total';
    pTotal.textContent = `Bs. ${parseFloat(pedido.monto_total || 0).toFixed(2)}`;
    detallesDiv.appendChild(pTotal);
    cuerpo.appendChild(detallesDiv);

    cuerpo.appendChild(this._crearLineaTiempo(pedido));

    if (pedido.estado === 'entregado' && !pedido.confirmacion_cliente) {
      cuerpo.appendChild(this._crearAccionConfirmar(pedido.id));
    }

    if (pedido.estado === 'cerrado' || pedido.confirmacion_cliente) {
      const textoConfirmado = document.createElement('div');
      textoConfirmado.className = 'pedido-tarjeta__acciones';
      const span = document.createElement('span');
      span.className = 'pedido-tarjeta__confirmacion-texto';
      span.textContent = '✓ Pedido finalizado y confirmado';
      textoConfirmado.appendChild(span);
      cuerpo.appendChild(textoConfirmado);
    }

    const seccionQR = this._crearSeccionQR(pedido);
    if (seccionQR) cuerpo.appendChild(seccionQR);

    if (pedido.metodo_entrega === 'recojo_almacen' && pedido.estado === 'listo para entregarse') {
      cuerpo.appendChild(this._crearAccionRetiro(pedido.id));
    }

    const seccionDevolucion = this._crearSeccionDevolucion(pedido);
    if (seccionDevolucion) cuerpo.appendChild(seccionDevolucion);

    articulo.appendChild(cabecera);
    articulo.appendChild(cuerpo);
    return articulo;
  }

  _crearLineaTiempo(pedido) {
    const ul = document.createElement('ul');
    ul.className = 'linea-tiempo';

    const historial = pedido.historial_estados || [];
    const mapaFechas = Object.fromEntries(historial.map((h) => [h.estado, h.fecha_cambio]));

    const estados = pedido.metodo_entrega === 'delivery' ? VistaHistorial.ESTADOS_DELIVERY : VistaHistorial.ESTADOS_RECOJO;
    const estadoNormalizado = pedido.estado === 'recibido' ? 'orden realizada' : pedido.estado;
    let estadoActualIndex = estados.indexOf(estadoNormalizado);
    if (estadoActualIndex === -1 && pedido.estado === 'cerrado') estadoActualIndex = estados.length;

    estados.forEach((estado, indice) => {
      let claseModificador;
      if (indice < estadoActualIndex) claseModificador = 'linea-tiempo__paso--completado';
      else if (indice === estadoActualIndex) claseModificador = 'linea-tiempo__paso--actual';
      else claseModificador = 'linea-tiempo__paso--pendiente';

      const li = document.createElement('li');
      li.className = `linea-tiempo__paso ${claseModificador}`;

      const punto = document.createElement('div');
      punto.className = 'linea-tiempo__punto';
      li.appendChild(punto);

      const nombreEstado = document.createElement('span');
      nombreEstado.className = 'linea-tiempo__nombre-estado';
      nombreEstado.textContent = VistaHistorial.NOMBRES_ESTADOS[estado] || estado;
      li.appendChild(nombreEstado);

      if (mapaFechas[estado]) {
        const fechaEstado = document.createElement('span');
        fechaEstado.className = 'linea-tiempo__fecha-estado';
        fechaEstado.textContent = new Date(mapaFechas[estado]).toLocaleString('es-BO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        li.appendChild(fechaEstado);
      }

      ul.appendChild(li);
    });

    if (pedido.estado === 'cerrado') {
      const liCerrado = document.createElement('li');
      liCerrado.className = 'linea-tiempo__paso linea-tiempo__paso--completado';
      const puntoCerrado = document.createElement('div');
      puntoCerrado.className = 'linea-tiempo__punto';
      liCerrado.appendChild(puntoCerrado);
      const nombreCerrado = document.createElement('span');
      nombreCerrado.className = 'linea-tiempo__nombre-estado';
      nombreCerrado.textContent = 'Cerrado';
      liCerrado.appendChild(nombreCerrado);
      ul.appendChild(liCerrado);
    }

    return ul;
  }

  _crearSeccionQR(pedido) {
    if (pedido.metodo_entrega !== 'recojo_almacen') return null;
    const estadosMostrar = ['orden realizada', 'en proceso', 'listo para entregarse'];
    if (!estadosMostrar.includes(pedido.estado)) return null;

    const seccion = document.createElement('div');
    seccion.className = 'pedido-tarjeta__seccion-qr';

    const titulo = document.createElement('p');
    titulo.className = 'pedido-tarjeta__qr-titulo';
    titulo.textContent = pedido.estado === 'listo para entregarse'
      ? '¡Tu pedido está listo! Muestra este código QR al retirar en almacén'
      : 'Código QR para retiro en almacén (Av. San Martín 450, Santa Cruz)';
    seccion.appendChild(titulo);

    const contenedorQR = document.createElement('div');
    contenedorQR.className = 'pedido-tarjeta__qr-contenedor';

    const imagenQR = document.createElement('img');
    imagenQR.className = 'pedido-tarjeta__qr-imagen';
    imagenQR.alt = `QR de retiro pedido #${pedido.id}`;
    imagenQR.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pedido.id)}`;
    contenedorQR.appendChild(imagenQR);

    const idTexto = document.createElement('span');
    idTexto.className = 'pedido-tarjeta__qr-id';
    idTexto.textContent = `ID: ${pedido.id.toString().slice(0, 8).toUpperCase()}`;
    contenedorQR.appendChild(idTexto);

    seccion.appendChild(contenedorQR);
    return seccion;
  }

  _crearSeccionDevolucion(pedido) {
    const estadosConDevolucion = ['entregado', 'cerrado'];
    if (!estadosConDevolucion.includes(pedido.estado) && !pedido.confirmacion_cliente) return null;

    const divDevolucion = document.createElement('div');
    divDevolucion.className = 'pedido-tarjeta__acciones';

    if (pedido.devolucion) {
      const estadoDevolucion = pedido.devolucion.estado_devolucion;
      const spanEstado = document.createElement('span');
      spanEstado.className = `pedido-tarjeta__devolucion-estado pedido-tarjeta__devolucion-estado--${estadoDevolucion}`;
      const textos = { pendiente: 'Devolucion solicitada - En revision', aprobada: '✓ Devolucion aprobada - Reembolso procesado', rechazada: '✗ Devolucion rechazada' };
      spanEstado.textContent = textos[estadoDevolucion] || estadoDevolucion;
      divDevolucion.appendChild(spanEstado);
      return divDevolucion;
    }

    if (!pedido.fecha_entrega_final) return null;

    const diferencia = new Date() - new Date(pedido.fecha_entrega_final);
    const dentroDelPlazo = diferencia <= 24 * 60 * 60 * 1000;

    if (dentroDelPlazo) {
      const btnDevolucion = document.createElement('button');
      btnDevolucion.className = 'pedido-tarjeta__boton pedido-tarjeta__boton--devolucion';
      btnDevolucion.textContent = 'Solicitar Devolucion';
      btnDevolucion.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('devolucion:modalAbierto', { detail: { pedidoId: pedido.id } }));
      });
      divDevolucion.appendChild(btnDevolucion);
    } else {
      const spanVencido = document.createElement('span');
      spanVencido.className = 'pedido-tarjeta__devolucion-vencido';
      spanVencido.textContent = 'Plazo de devolucion vencido (24 horas)';
      divDevolucion.appendChild(spanVencido);
    }

    return divDevolucion;
  }

  _crearAccionConfirmar(pedidoId) {
    const acciones = document.createElement('div');
    acciones.className = 'pedido-tarjeta__acciones';
    const btn = document.createElement('button');
    btn.className = 'pedido-tarjeta__boton pedido-tarjeta__boton--confirmar';
    btn.textContent = 'Confirmar Recepcion';
    btn.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('pedido:recepcionSolicitada', { detail: { pedidoId } }));
    });
    acciones.appendChild(btn);
    return acciones;
  }

  _crearAccionRetiro(pedidoId) {
    const accionesRetiro = document.createElement('div');
    accionesRetiro.className = 'pedido-tarjeta__acciones';
    const btnRetiro = document.createElement('button');
    btnRetiro.className = 'pedido-tarjeta__boton pedido-tarjeta__boton--confirmar';
    btnRetiro.textContent = 'Confirmar mi Retiro en Almacén';
    btnRetiro.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('pedido:retiroSolicitado', { detail: { pedidoId } }));
    });
    accionesRetiro.appendChild(btnRetiro);
    return accionesRetiro;
  }

  _etiquetaEstado(estado) {
    if (!estado) return '';
    return VistaHistorial.NOMBRES_ESTADOS[estado] || estado.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

export default VistaHistorial;
