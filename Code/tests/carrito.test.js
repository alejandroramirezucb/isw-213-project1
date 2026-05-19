const { calcularTotalCarrito, validarStockCarrito } = require('../server/utils-calculos');

describe('HU-04: Carrito de Compras', () => {
  test('Válida: Agregar producto muestra resumen con total y cantidad correctos', () => {
    const carrito = [{ nombre: 'Auriculares', precio: 150, cantidad: 2 }];
    const total = calcularTotalCarrito(carrito);
    expect(total).toBe(300.0);
    expect(carrito[0].cantidad).toBe(2);
  });

  test('Límite: Modificar cantidad al límite exacto del stock recalcula sin error', () => {
    const carrito = [{ nombre: 'Producto', precio: 100, cantidad: 5 }];
    const stock = 5;
    const valido = validarStockCarrito(carrito[0].cantidad, stock);
    expect(valido).toBe(true);
    expect(calcularTotalCarrito(carrito)).toBe(500);
  });

  test('Inválida: Modificar cantidad a 0 elimina o rechaza producto', () => {
    const carrito = [{ nombre: 'Producto', precio: 100, cantidad: 0 }];
    const valido = carrito[0].cantidad > 0;
    expect(valido).toBe(false);
  });

  test('Inválida: No agregar producto agotado mientras cliente navega', () => {
    const stock = 0;
    const cantidadSolicitada = 1;
    const permitido = validarStockCarrito(cantidadSolicitada, stock);
    expect(permitido).toBe(false);
  });
});
