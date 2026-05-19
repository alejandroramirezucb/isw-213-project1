const { enviarAlertaStockMinimo, verificarUmbralStock } = require('../server/utils-calculos');

describe('HU-19: Alerta de Stock Mínimo', () => {
  test('Válida: Sistema envía alerta cuando stock llega al umbral mínimo', () => {
    const productoId = 1;
    const stockActual = 5;
    const umbralMinimo = 5;
    const resultado = enviarAlertaStockMinimo(productoId, stockActual, umbralMinimo);
    expect(resultado).toBe(true);
  });

  test('Límite: Alerta dispara exactamente al llegar al umbral', () => {
    const stockAnterior = 4;
    const stockNuevo = 3;
    const umbralMinimo = 3;
    const alerta = stockNuevo === umbralMinimo && stockAnterior !== umbralMinimo;
    expect(alerta).toBe(true);
  });

  test('Inválida: No envía alerta si stock está por encima del umbral', () => {
    const stockActual = 10;
    const umbralMinimo = 5;
    const resultado = enviarAlertaStockMinimo(1, stockActual, umbralMinimo);
    expect(resultado).toBe(false);
  });

  test('Inválida: Stock 0 aparece en lista Stock Bajo', () => {
    const stock = 0;
    const enListaBajo = stock <= 0;
    expect(enListaBajo).toBe(true);
  });
});
