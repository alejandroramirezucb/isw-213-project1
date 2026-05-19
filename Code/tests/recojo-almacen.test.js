const { aplicarRecojo, validarQRRecojo, cambiarDeliveryARecojo } = require('../server/utils-calculos');

describe('HU-13: Opción de Recojo en Almacén', () => {
  test('Válida: Recojo elimina cargo delivery y muestra dirección', () => {
    const carrito = { delivery: 20 };
    const resultado = aplicarRecojo(carrito);
    expect(resultado.delivery).toBe(0);
  });

  test('Límite: QR cliente es escaneado correctamente en almacén', () => {
    const qrId = 'qr123';
    const pedidoId = 1;
    const resultado = validarQRRecojo(qrId, pedidoId);
    expect(resultado).toBe(true);
  });

  test('Inválida: QR de otro pedido no retira pedido diferente', () => {
    const qrPedido1 = 'qr1';
    const pedidoId2 = 2;
    const resultado = validarQRRecojo(qrPedido1, pedidoId2);
    expect(resultado).toBe(false);
  });

  test('Inválida: No cambiar delivery a recojo si ENVIADO con chofer', () => {
    const estado = 'ENVIADO';
    const resultado = cambiarDeliveryARecojo(estado);
    expect(resultado).toBe(false);
  });
});
