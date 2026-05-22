class VistaSoporte {
  constructor() {
    document.addEventListener('soporte:listaCargada', (e) => this._renderizar(e.detail.mensajes));
    this._crearModal();
  }

  _renderizar(mensajes) {
    const tbody = document.getElementById('tabla-soporte-body');
    const mensajeVacio = document.getElementById('mensaje-sin-soporte');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (mensajes.length === 0) {
      mensajeVacio?.classList.add('panel-admin__mensaje-vacio--visible');
      return;
    }
    mensajeVacio?.classList.remove('panel-admin__mensaje-vacio--visible');

    mensajes.forEach((m) => tbody.appendChild(this._crearFila(m)));
  }

  _crearFila(m) {
    const tr = document.createElement('tr');
    tr.className = 'panel-admin__tabla-fila';

    [
      m.id ? `#${m.id.toString().slice(0, 8)}` : '',
      m.nombre || '',
      m.email || '',
      m.categoria || '',
      m.mensaje ? m.mensaje.substring(0, 30) + (m.mensaje.length > 30 ? '...' : '') : '',
      m.fecha_creacion ? new Date(m.fecha_creacion).toLocaleString('es-BO') : '',
      m.estado || '',
    ].forEach((texto) => {
      const td = document.createElement('td');
      td.className = 'panel-admin__tabla-td';
      td.textContent = texto;
      tr.appendChild(td);
    });

    const tdAcc = document.createElement('td');
    tdAcc.className = 'panel-admin__tabla-td panel-admin__tabla-td--acciones';

    if (m.estado === 'pendiente') {
      const btnResp = document.createElement('button');
      btnResp.className = 'panel-admin__boton panel-admin__boton--primario';
      btnResp.textContent = 'Responder';
      btnResp.addEventListener('click', () => this._abrirModal(m.id));
      tdAcc.appendChild(btnResp);
    } else {
      const span = document.createElement('span');
      span.textContent = m.respuesta_admin || '';
      tdAcc.appendChild(span);
    }

    tr.appendChild(tdAcc);
    return tr;
  }

  _crearModal() {
    const modal = document.createElement('aside');
    modal.className = 'panel-admin__modal-overlay';
    modal.id = 'modal-respuesta-soporte';
    modal.innerHTML = `
      <div class="panel-admin__modal">
        <div class="panel-admin__modal-cabecera">
          <h3 class="panel-admin__modal-titulo">Responder Mensaje</h3>
          <button class="panel-admin__modal-cerrar" id="btn-cerrar-modal-respuesta">&times;</button>
        </div>
        <form class="panel-admin__modal-formulario" id="form-respuesta-soporte">
          <div class="panel-admin__campo">
            <label class="panel-admin__etiqueta" for="respuesta-soporte">Respuesta</label>
            <textarea id="respuesta-soporte" class="panel-admin__entrada panel-admin__entrada--textarea" rows="4" required></textarea>
          </div>
          <input type="hidden" id="mensaje-id-accion" />
          <div class="panel-admin__modal-acciones">
            <button type="button" class="panel-admin__boton panel-admin__boton--secundario" id="btn-cancelar-respuesta">Cancelar</button>
            <button type="submit" class="panel-admin__boton panel-admin__boton--primario">Enviar</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('btn-cerrar-modal-respuesta')?.addEventListener('click', () => this._cerrarModal());
    document.getElementById('btn-cancelar-respuesta')?.addEventListener('click', () => this._cerrarModal());
    modal.addEventListener('click', (e) => { if (e.target === modal) this._cerrarModal(); });

    document.getElementById('form-respuesta-soporte')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('mensaje-id-accion')?.value;
      const respuesta = document.getElementById('respuesta-soporte')?.value.trim();
      if (!respuesta) return;
      document.dispatchEvent(new CustomEvent('soporte:respuestaEnviada', { detail: { mensajeId: id, respuesta } }));
    });
  }

  _abrirModal(id) {
    if (document.getElementById('mensaje-id-accion')) document.getElementById('mensaje-id-accion').value = id;
    if (document.getElementById('respuesta-soporte')) document.getElementById('respuesta-soporte').value = '';
    document.getElementById('modal-respuesta-soporte')?.classList.add('panel-admin__modal-overlay--visible');
  }

  _cerrarModal() {
    document.getElementById('modal-respuesta-soporte')?.classList.remove('panel-admin__modal-overlay--visible');
  }
}

export default VistaSoporte;
