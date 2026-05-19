const { calcularStockFinal, validarStock } = require('../server/utils-calculos');

describe('HU-03: Gestión de Stock', () => {
  test('Válida: Stock se reduce automáticamente en la cantidad comprada', () => {
    const stockFinal = calcularStockFinal(10, 3);

    expect(stockFinal).toBe(7);
  });

  test('Límite: Reducir stock hasta exactamente cero lo marca como agotado', () => {
    const nuevoStock = calcularStockFinal(5, 5);
    const agotado = nuevoStock === 0;

    expect(nuevoStock).toBe(0);
    expect(agotado).toBe(true);
  });

  test('Inválida: No se permite agregar al carrito producto sin stock disponible', () => {
    const permitido = validarStock(0, 1);
    const botonDeshabilitado = !permitido;

    expect(permitido).toBe(false);
    expect(botonDeshabilitado).toBe(true);
  });

  test('Inválida: No se puede vender más unidades de las disponibles en stock', () => {
    const permitido = validarStock(3, 5);

    expect(permitido).toBe(false);
  });
});
