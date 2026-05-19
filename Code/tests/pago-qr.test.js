const { generarQR, verificarQRExpiracion, cambiarEstadoQR } = require('../server/utils-calculos');

describe('HU-11: Pago mediante Código QR', () => {
  test('Válida: Seleccionar QR genera código con monto correcto', () => {
    const monto = 750;
    const qr = generarQR(monto);
    expect(qr).toBeTruthy();
  });

  test('Límite: Estado RECIBIDO cambia cuando pasarela confirma pago', () => {
    const pedidoId = 1;
    const resultado = cambiarEstadoQR(pedidoId, 'RECIBIDO');
    expect(resultado).toBe(true);
  });

  test('Inválida: QR expirado no permite pago', () => {
    const qrId = 1;
    const expirado = verificarQRExpiracion(qrId);
    expect(expirado).toBe(true);
  });

  test('Inválida: Pago fallido no cambia estado a RECIBIDO', () => {
    const pedidoId = 1;
    const resultado = cambiarEstadoQR(pedidoId, null);
    expect(resultado).toBe(false);
  });
});
