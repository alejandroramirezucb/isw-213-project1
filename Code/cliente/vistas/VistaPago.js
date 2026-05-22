class VistaPago {
  static COSTO_DELIVERY = 15;

  constructor(carritoServicio) {
    this._carritoServicio = carritoServicio;
    this._bindEventos();
  }

  _bindEventos() {
    document.querySelectorAll('input[name="metodo-entrega"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        const campoDir = document.getElementById('campo-direccion');
        const infoAlmacen = document.getElementById('info-almacen');
        const esDelivery = radio.value === 'delivery';
        if (campoDir) campoDir.classList.toggle('campo-adicional--oculto', !esDelivery);
        if (infoAlmacen) infoAlmacen.classList.toggle('campo-adicional--oculto', esDelivery);
        document.dispatchEvent(new CustomEvent('pago:metodoCambiado', { detail: { metodo: radio.value } }));
      });
    });

    const btnCerrar = document.getElementById('btn-cerrar-modal');
    if (btnCerrar) {
      btnCerrar.onclick = () => document.getElementById('modal-pago')?.classList.remove('modal-pago--visible');
    }

    const formTarjeta = document.getElementById('form-tarjeta');
    if (formTarjeta) {
      formTarjeta.onsubmit = (e) => {
        e.preventDefault();
        formTarjeta.classList.add('form-tarjeta--oculto');
        const areaEstado = document.getElementById('estado-tarjeta');
        if (areaEstado) areaEstado.classList.add('modal-pago__estado--visible');
        setTimeout(() => {
          document.dispatchEvent(new CustomEvent('pago:formEnviado', { detail: { metodoPago: 'tarjeta', estadoPago: 'pagado' } }));
        }, 2500);
      };
    }
  }

  abrirModalPago(total, metodoPago) {
    const modal = document.getElementById('modal-pago');
    const pagoQR = document.getElementById('pago-qr');
    const pagoTarjetaEl = document.getElementById('pago-tarjeta');

    if (metodoPago === 'tarjeta') {
      pagoQR?.classList.remove('modal-pago__panel--visible');
      pagoTarjetaEl?.classList.add('modal-pago__panel--visible');
      document.getElementById('form-tarjeta')?.classList.remove('form-tarjeta--oculto');
      document.getElementById('estado-tarjeta')?.classList.remove('modal-pago__estado--visible');
      const montoTarjeta = document.getElementById('monto-tarjeta');
      if (montoTarjeta) montoTarjeta.textContent = `Bs. ${total.toFixed(2)}`;
    } else if (metodoPago === 'qr') {
      pagoTarjetaEl?.classList.remove('modal-pago__panel--visible');
      pagoQR?.classList.add('modal-pago__panel--visible');
      const montoQR = document.getElementById('monto-qr');
      if (montoQR) montoQR.textContent = `Bs. ${total.toFixed(2)}`;
      const textoQR = document.getElementById('texto-estado-qr');
      if (textoQR) textoQR.textContent = 'Esperando confirmación del banco...';
      const qrImg = document.getElementById('qr-img');
      if (qrImg) {
        const qrData = encodeURIComponent(`Raidencenter|Monto:${total.toFixed(2)}|Bs`);
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`;
      }
      setTimeout(() => {
        if (textoQR) textoQR.textContent = '¡Pago confirmado por el banco!';
        setTimeout(() => {
          document.dispatchEvent(new CustomEvent('pago:formEnviado', { detail: { metodoPago: 'qr', estadoPago: 'pagado' } }));
        }, 1200);
      }, 4000);
    }

    modal?.classList.add('modal-pago--visible');
  }

  cerrarModal() {
    document.getElementById('modal-pago')?.classList.remove('modal-pago--visible');
  }
}

export default VistaPago;
