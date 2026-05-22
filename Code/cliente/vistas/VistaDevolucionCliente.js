class VistaDevolucionCliente {
  constructor() {
    document.addEventListener('devolucion:modalAbierto', (e) => this._abrir(e.detail.pedidoId));
    this._bindModal();
  }

  _bindModal() {
    const btnCerrar = document.getElementById('btn-cerrar-devolucion');
    const btnCancelar = document.getElementById('btn-cancelar-devolucion');
    const formulario = document.getElementById('formulario-devolucion');
    const inputFoto = document.getElementById('devolucion-foto');
    const previewImg = document.getElementById('devolucion-preview');
    const modal = document.getElementById('modal-devolucion');

    if (!formulario) return;

    btnCerrar?.addEventListener('click', () => this._cerrar());
    btnCancelar?.addEventListener('click', () => this._cerrar());

    modal?.addEventListener('click', (e) => { if (e.target === modal) this._cerrar(); });

    inputFoto?.addEventListener('change', () => {
      if (inputFoto.files && inputFoto.files[0]) {
        const lector = new FileReader();
        lector.onload = (e) => {
          if (previewImg) {
            previewImg.src = e.target.result;
            previewImg.style.display = 'block';
          }
        };
        lector.readAsDataURL(inputFoto.files[0]);
      }
    });

    formulario.addEventListener('submit', (e) => {
      e.preventDefault();
      const pedidoId = document.getElementById('devolucion-pedido-id')?.value;
      const motivo = document.getElementById('devolucion-motivo')?.value.trim();
      const archivo = inputFoto?.files[0];

      if (!motivo) {
        if (window.showToast) window.showToast('Debes ingresar un motivo para la devolucion', { tipo: 'warning' });
        return;
      }
      if (!archivo) {
        if (window.showToast) window.showToast('Debes adjuntar una foto de la factura', { tipo: 'warning' });
        return;
      }

      document.dispatchEvent(new CustomEvent('devolucion:solicitada', {
        detail: { pedidoId, motivo, archivo },
      }));
    });
  }

  _abrir(pedidoId) {
    const modal = document.getElementById('modal-devolucion');
    if (document.getElementById('devolucion-pedido-id')) {
      document.getElementById('devolucion-pedido-id').value = pedidoId;
    }
    document.getElementById('devolucion-motivo') && (document.getElementById('devolucion-motivo').value = '');
    document.getElementById('devolucion-foto') && (document.getElementById('devolucion-foto').value = '');
    const preview = document.getElementById('devolucion-preview');
    if (preview) preview.style.display = 'none';
    modal?.classList.add('modal-devolucion--visible');
  }

  _cerrar() {
    document.getElementById('modal-devolucion')?.classList.remove('modal-devolucion--visible');
  }
}

export default VistaDevolucionCliente;
