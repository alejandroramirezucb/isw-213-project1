class VistaEvidencia {
  constructor() {
    document.addEventListener('entrega:evidenciaSolicitada', (e) => this._abrir(e.detail.pedidoId, e.detail.envioId));
    this._bindModal();
  }

  _bindModal() {
    const modal = document.getElementById('modal-evidencia');
    const btnCerrar = document.getElementById('btn-cerrar-evidencia');
    const btnCancelar = document.getElementById('btn-cancelar-evidencia');
    const formulario = document.getElementById('form-evidencia');
    const inputFoto = document.getElementById('evidencia-foto');
    const previewImg = document.getElementById('preview-imagen');
    const placeholder = document.getElementById('archivo-placeholder');

    btnCerrar?.addEventListener('click', () => this._cerrar());
    btnCancelar?.addEventListener('click', () => this._cerrar());

    modal?.addEventListener('click', (e) => { if (e.target === modal) this._cerrar(); });

    inputFoto?.addEventListener('change', () => {
      if (inputFoto.files && inputFoto.files[0]) {
        const lector = new FileReader();
        lector.onload = (e) => {
          if (previewImg) {
            previewImg.src = e.target.result;
            previewImg.classList.add('panel-chofer__preview-imagen--visible');
          }
          placeholder?.classList.add('panel-chofer__archivo-placeholder--oculto');
        };
        lector.readAsDataURL(inputFoto.files[0]);
      }
    });

    formulario?.addEventListener('submit', (e) => {
      e.preventDefault();
      const pedidoId = document.getElementById('evidencia-pedido-id')?.value;
      const envioId = document.getElementById('evidencia-envio-id')?.value;
      const archivo = inputFoto?.files[0];

      if (!archivo) {
        if (window.showToast) window.showToast('Debes subir una fotografía del paquete entregado', { tipo: 'warning' });
        return;
      }

      document.dispatchEvent(new CustomEvent('evidencia:enviada', {
        detail: { pedidoId, envioId, archivo },
      }));
    });
  }

  _abrir(pedidoId, envioId) {
    if (document.getElementById('evidencia-pedido-id')) document.getElementById('evidencia-pedido-id').value = pedidoId;
    if (document.getElementById('evidencia-envio-id')) document.getElementById('evidencia-envio-id').value = envioId;
    if (document.getElementById('evidencia-foto')) document.getElementById('evidencia-foto').value = '';

    const previewImg = document.getElementById('preview-imagen');
    const placeholder = document.getElementById('archivo-placeholder');
    previewImg?.classList.remove('panel-chofer__preview-imagen--visible');
    placeholder?.classList.remove('panel-chofer__archivo-placeholder--oculto');

    document.getElementById('modal-evidencia')?.classList.add('panel-chofer__modal-overlay--visible');
    this._obtenerUbicacion();
  }

  _cerrar() {
    document.getElementById('modal-evidencia')?.classList.remove('panel-chofer__modal-overlay--visible');
  }

  _obtenerUbicacion() {
    const divUbicacion = document.getElementById('ubicacion-actual');
    if (!divUbicacion) return;

    divUbicacion.textContent = 'Obteniendo ubicación...';

    if (!navigator.geolocation) {
      divUbicacion.textContent = 'GPS no disponible en este dispositivo';
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        const lat = posicion.coords.latitude.toFixed(6);
        const lng = posicion.coords.longitude.toFixed(6);
        divUbicacion.textContent = `Lat: ${lat} — Lng: ${lng}`;
      },
      () => { divUbicacion.textContent = 'No se pudo obtener la ubicación'; },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }
}

export default VistaEvidencia;
