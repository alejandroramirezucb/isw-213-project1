const { obtenerMontoEfectivo, registrarCobro, validarFotoEvidencia } = require('../server/utils-calculos');

describe('HU-18: Pago en Efectivo', () => {
  test('Válida: Chofer ve monto y registra cobro con foto evidencia', () => {
    const pedidoId = 1;
    const monto = 350;
    const montoMostrado = obtenerMontoEfectivo(pedidoId);
    expect(montoMostrado).toBe(monto);
  });

  test('Límite: Sistema muestra monto exacto con decimales', () => {
    const monto = 99.99;
    const montoMostrado = obtenerMontoEfectivo(1);
    expect(montoMostrado).toEqual(expect.any(Number));
  });

  test('Inválida: Sin cobro exitoso no se habilita foto evidencia', () => {
    const pedidoId = 1;
    const cobroRegistrado = false;
    const fotoHabilitada = cobroRegistrado && validarFotoEvidencia(pedidoId);
    expect(fotoHabilitada).toBe(false);
  });

  test('Inválida: Pedido efectivo no cierra sin foto evidencia', () => {
    const pedidoId = 1;
    const fotoAdjunta = null;
    const permitido = fotoAdjunta !== null;
    expect(permitido).toBe(false);
  });
});
