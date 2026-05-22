class VistaPedidosAdmin {
  constructor() {
    this._pedidos = [];
    document.addEventListener('pedido:listaCargada', (e) => this._renderizar(e.detail.pedidos));
    this._bindFiltros();
    this._bindConfirmacionQR();
  }

  _renderizar(pedidos) {
    this._pedidos = pedidos;
    this._renderizarTabla(pedidos);
  }

  _renderizarTabla(pedidos) {
    const tbody = document.getElementById('tabla-pedidos-admin-body');
    const mensajeVacio = document.getElementById('mensaje-sin-pedidos-admin');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (pedidos.length === 0) {
      mensajeVacio?.classList.add('panel-admin__mensaje-vacio--visible');
      return;
    }
    mensajeVacio?.classList.remove('panel-admin__mensaje-vacio--visible');

    pedidos.forEach((p) => tbody.appendChild(this._crearFila(p)));
  }

  _crearFila(pedido) {
    const tr = document.createElement('tr');
    tr.className = 'panel-admin__tabla-fila';

    const tdId = document.createElement('td');
    tdId.className = 'panel-admin__tabla-td';
    tdId.textContent = `#${(pedido.id || '').toString().slice(0, 8)}`;
    tr.appendChild(tdId);

    const tdCliente = document.createElement('td');
    tdCliente.className = 'panel-admin__tabla-td';
    tdCliente.textContent = pedido.nombre_cliente || 'Desconocido';
    tr.appendChild(tdCliente);

    const tdTotal = document.createElement('td');
    tdTotal.className = 'panel-admin__tabla-td';
    tdTotal.textContent = `Bs. ${parseFloat(pedido.monto_total || 0).toFixed(2)}`;
    tr.appendChild(tdTotal);

    const tdMetodo = document.createElement('td');
    tdMetodo.className = 'panel-admin__tabla-td';
    const etiquetaMetodo = document.createElement('span');
    const esAlmacen = pedido.metodo_entrega === 'recojo_almacen';
    etiquetaMetodo.className = `panel-admin__etiqueta-metodo ${esAlmacen ? 'panel-admin__etiqueta-metodo--almacen' : 'panel-admin__etiqueta-metodo--delivery'}`;
    etiquetaMetodo.textContent = esAlmacen ? 'Recojo Almacén' : 'Delivery';
    tdMetodo.appendChild(etiquetaMetodo);
    tr.appendChild(tdMetodo);

    const tdEstado = document.createElement('td');
    tdEstado.className = 'panel-admin__tabla-td';
    const claseEstado = (pedido.estado || '').replace(/\s+/g, '-');
    const spanEstado = document.createElement('span');
    spanEstado.className = `panel-admin__estado panel-admin__estado--${claseEstado}`;
    spanEstado.textContent = pedido.estado || '';
    tdEstado.appendChild(spanEstado);
    tr.appendChild(tdEstado);

    const tdAcciones = document.createElement('td');
    tdAcciones.className = 'panel-admin__tabla-td panel-admin__tabla-td--acciones';

    const siguienteEstado = this._siguienteEstado(pedido);
    if (siguienteEstado) {
      const btnAvanzar = document.createElement('button');
      btnAvanzar.className = 'panel-admin__boton panel-admin__boton--avanzar';
      btnAvanzar.textContent = this._textoBtnEstado(siguienteEstado);
      btnAvanzar.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('pedido:avanceSolicitado', {
          detail: { pedidoId: pedido.id, estado: siguienteEstado },
        }));
      });
      tdAcciones.appendChild(btnAvanzar);
    }

    tr.appendChild(tdAcciones);
    return tr;
  }

  _bindFiltros() {
    document.querySelectorAll('[data-filtro-pedido]').forEach((boton) => {
      boton.addEventListener('click', () => {
        document.querySelectorAll('[data-filtro-pedido]').forEach((b) => b.classList.remove('panel-admin__boton--filtro-activo'));
        boton.classList.add('panel-admin__boton--filtro-activo');
        const filtro = boton.getAttribute('data-filtro-pedido');
        const filtrados = filtro === 'todos' ? this._pedidos : this._pedidos.filter((p) => p.estado === filtro);
        this._renderizarTabla(filtrados);
      });
    });
  }

  _bindConfirmacionQR() {
    const boton = document.getElementById('btn-confirmar-qr');
    const entrada = document.getElementById('qr-pedido-id');
    if (!boton || !entrada) return;

    boton.addEventListener('click', () => {
      const pedidoId = entrada.value.trim();
      if (!pedidoId) {
        if (window.showToast) window.showToast('Ingresa o escanea el ID del pedido', { tipo: 'warning' });
        return;
      }
      document.dispatchEvent(new CustomEvent('pedido:retiroConfirmado', { detail: { pedidoId } }));
    });
  }

  limpiarEntradaQR() {
    const entrada = document.getElementById('qr-pedido-id');
    if (entrada) entrada.value = '';
  }

  _siguienteEstado(pedido) {
    const estado = pedido.estado;
    const metodo = pedido.metodo_entrega;
    if (estado === 'orden realizada' || estado === 'recibido') return 'en proceso';
    if (metodo === 'recojo_almacen' && estado === 'en proceso') return 'listo para entregarse';
    if (metodo === 'delivery' && estado === 'en proceso') return 'enviado';
    return null;
  }

  _textoBtnEstado(estado) {
    const textos = { 'en proceso': 'Procesar', enviado: 'Marcar Enviado', 'listo para entregarse': 'Listo para Retiro' };
    return textos[estado] || estado;
  }
}

export default VistaPedidosAdmin;
