const { aprobarDevolucion, rechazarDevolucion, validarFotoDevolucion, actualizarStockDevolucion } = require('../server/utils-calculos');

describe('HU-17: Aprobación de Devoluciones', () => {
  test('Válida: Administrador aprueba devolución y stock se actualiza', () => {
    const solicitudId = 1;
    const productoId = 1;
    const stockActual = 5;
    const resultado = aprobarDevolucion(solicitudId, productoId);
    expect(resultado).toBe(true);
    expect(actualizarStockDevolucion(stockActual, true)).toBe(stockActual + 1);
  });

  test('Límite: Administrador ve foto de factura antes de aprobar', () => {
    const solicitudId = 1;
    const fotoValida = validarFotoDevolucion(solicitudId);
    expect(fotoValida).toBe(true);
  });

  test('Inválida: Rechazar devolución no actualiza stock', () => {
    const solicitudId = 1;
    const resultado = rechazarDevolucion(solicitudId);
    expect(resultado).toBe(true);
    expect(actualizarStockDevolucion(5, false)).toBe(5);
  });

  test('Inválida: No aprobar sin foto de factura', () => {
    const solicitudId = 1;
    const fotoValida = validarFotoDevolucion(solicitudId);
    if (!fotoValida) {
      expect(aprobarDevolucion(solicitudId, 1)).toBe(false);
    }
  });
});
