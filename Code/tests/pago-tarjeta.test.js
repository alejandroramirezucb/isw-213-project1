const { procesarPago, validarTarjeta, generarFactura } = require('../server/utils-calculos');

describe('HU-05: Pago con Tarjeta de Crédito/Débito', () => {
  test('Válida: Pago aprobado genera factura y cambia estado a RECIBIDO', () => {
    const monto = 500;
    const resultado = procesarPago(monto, true);
    expect(resultado).toBe(true);
    expect(generarFactura(monto, true)).toBe(true);
  });

  test('Límite: Pago por monto mínimo $0.01 se procesa correctamente', () => {
    const montoMinimo = 0.01;
    const resultado = procesarPago(montoMinimo, true);
    expect(resultado).toBe(true);
  });

  test('Inválida: Pago rechazado no genera factura', () => {
    const monto = 500;
    const resultado = procesarPago(monto, false);
    expect(resultado).toBe(false);
    expect(generarFactura(monto, false)).toBe(false);
  });

  test('Inválida: Tarjeta inválida rechaza pago', () => {
    const tarjeta = { numero: '0000000000000000', cvv: '000' };
    const valida = validarTarjeta(tarjeta);
    expect(valida).toBe(false);
  });
});
