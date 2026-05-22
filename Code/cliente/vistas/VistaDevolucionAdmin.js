class VistaDevolucionAdmin {
  constructor() {
    this._devoluciones = [];
    document.addEventListener('devolucion:listaCargada', (e) => this._renderizar(e.detail.devoluciones));
    this._bindFiltros();
    this._bindModal();
  }

  _renderizar(devoluciones) {
    this._devoluciones = devoluciones;
    this._renderizarTabla(devoluciones);
  }

  _renderizarTabla(devoluciones) {
    const tbody = document.getElementById('tabla-devoluciones-body');
    const mensajeVacio = document.getElementById('mensaje-sin-devoluciones');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (devoluciones.length === 0) {
      mensajeVacio?.classList.add('panel-admin__mensaje-vacio--visible');
      return;
    }
    mensajeVacio?.classList.remove('panel-admin__mensaje-vacio--visible');

    devoluciones.forEach((d) => tbody.appendChild(this._crearFila(d)));
  }

  _crearFila(devolucion) {
    const tr = document.createElement('tr');
    tr.className = 'panel-admin__tabla-fila';

    const celdas = [
      `#${(devolucion.pedido_id || '').toString().slice(0, 8)}`,
      devolucion.nombre_cliente || 'Desconocido',
      devolucion.motivo_devolucion || '',
    ];

    celdas.forEach((texto, i) => {
      const td = document.createElement('td');
      td.className = i === 2 ? 'panel-admin__tabla-td panel-admin__tabla-td--motivo' : 'panel-admin__tabla-td';
      td.textContent = texto;
      tr.appendChild(td);
    });

    const tdFactura = document.createElement('td');
    tdFactura.className = 'panel-admin__tabla-td';
    if (devolucion.foto_factura_url) {
      const enlace = document.createElement('a');
      enlace.href = devolucion.foto_factura_url;
      enlace.target = '_blank';
      enlace.rel = 'noopener noreferrer';
      enlace.className = 'panel-admin__enlace-factura';
      enlace.textContent = 'Ver factura';
      tdFactura.appendChild(enlace);
    } else {
      tdFactura.textContent = 'Sin imagen';
    }
    tr.appendChild(tdFactura);

    const tdFecha = document.createElement('td');
    tdFecha.className = 'panel-admin__tabla-td';
    if (devolucion.fecha_solicitud) {
      const fecha = new Date(devolucion.fecha_solicitud);
      tdFecha.textContent = `${fecha.toLocaleDateString('es-BO')} ${fecha.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}`;
    }
    tr.appendChild(tdFecha);

    const tdEstado = document.createElement('td');
    tdEstado.className = 'panel-admin__tabla-td';
    const etiquetaEstado = document.createElement('span');
    etiquetaEstado.className = `panel-admin__estado panel-admin__estado--devolucion-${devolucion.estado_devolucion}`;
    const textos = { pendiente: 'Pendiente', aprobada: 'Aprobada', rechazada: 'Rechazada' };
    etiquetaEstado.textContent = textos[devolucion.estado_devolucion] || devolucion.estado_devolucion;
    tdEstado.appendChild(etiquetaEstado);
    tr.appendChild(tdEstado);

    const tdAcciones = document.createElement('td');
    tdAcciones.className = 'panel-admin__tabla-td panel-admin__tabla-td--acciones';

    if (devolucion.estado_devolucion === 'pendiente') {
      ['aprobar', 'rechazar'].forEach((accion) => {
        const btn = document.createElement('button');
        btn.className = `panel-admin__boton panel-admin__boton--${accion}`;
        btn.textContent = accion.charAt(0).toUpperCase() + accion.slice(1);
        btn.addEventListener('click', () => this._abrirModal(devolucion.id, accion));
        tdAcciones.appendChild(btn);
      });
    } else {
      const span = document.createElement('span');
      span.className = 'panel-admin__observaciones-texto';
      span.textContent = devolucion.observaciones_admin || 'Sin observaciones';
      tdAcciones.appendChild(span);
    }

    tr.appendChild(tdAcciones);
    return tr;
  }

  _bindFiltros() {
    document.querySelectorAll('[data-filtro-devolucion]').forEach((boton) => {
      boton.addEventListener('click', () => {
        document.querySelectorAll('[data-filtro-devolucion]').forEach((b) => b.classList.remove('panel-admin__boton--filtro-activo'));
        boton.classList.add('panel-admin__boton--filtro-activo');
        const filtro = boton.getAttribute('data-filtro-devolucion');
        const filtradas = filtro === 'todas' ? this._devoluciones : this._devoluciones.filter((d) => d.estado_devolucion === filtro);
        this._renderizarTabla(filtradas);
      });
    });
  }

  _bindModal() {
    const modal = document.getElementById('modal-observaciones-devolucion');
    if (!modal) return;

    document.getElementById('btn-cerrar-modal-observaciones')?.addEventListener('click', () => this._cerrarModal());
    document.getElementById('btn-cancelar-observaciones')?.addEventListener('click', () => this._cerrarModal());
    modal.addEventListener('click', (e) => { if (e.target === modal) this._cerrarModal(); });

    document.getElementById('form-observaciones-devolucion')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const devolucionId = document.getElementById('devolucion-id-accion')?.value;
      const accion = document.getElementById('devolucion-tipo-accion')?.value;
      const observaciones = document.getElementById('observaciones-devolucion')?.value;

      document.dispatchEvent(new CustomEvent('devolucion:accionConfirmada', {
        detail: { devolucionId, accion, observaciones },
      }));
    });
  }

  _abrirModal(devolucionId, accion) {
    const modal = document.getElementById('modal-observaciones-devolucion');
    if (document.getElementById('devolucion-id-accion')) document.getElementById('devolucion-id-accion').value = devolucionId;
    if (document.getElementById('devolucion-tipo-accion')) document.getElementById('devolucion-tipo-accion').value = accion;
    if (document.getElementById('observaciones-devolucion')) document.getElementById('observaciones-devolucion').value = '';
    const titulo = modal?.querySelector('.panel-admin__modal-titulo');
    if (titulo) titulo.textContent = accion === 'aprobar' ? 'Aprobar Devolución' : 'Rechazar Devolución';
    modal?.classList.add('panel-admin__modal-overlay--visible');
  }

  _cerrarModal() {
    document.getElementById('modal-observaciones-devolucion')?.classList.remove('panel-admin__modal-overlay--visible');
  }
}

export default VistaDevolucionAdmin;
