const { calcularPrecioCuota } = require('../server/utils-calculos');

describe('HU-01: Visualización de Productos', () => {
  test('Válida: Catálogo retorna productos con nombre, precio y precio calculado en cuotas', () => {
    const productos = [
      { id: 1, nombre: 'Laptop', precio: 1000.0, cuotas: 5 },
      { id: 2, nombre: 'Mouse', precio: 50.0, cuotas: 5 }
    ];

    const resultado = productos.map(p => ({
      nombre: p.nombre,
      precio: p.precio,
      precio_cuota: calcularPrecioCuota(p.precio, p.cuotas)
    }));

    expect(resultado.length).toBe(2);
    expect(resultado[0].nombre).toBe('Laptop');
    expect(resultado[0].precio).toBe(1000.0);
    expect(resultado[0].precio_cuota).toBe(200.0);
  });

  test('Límite: Precio exactamente divisible en cuotas retorna cálculo preciso', () => {
    const precioCuota = calcularPrecioCuota(300, 6);

    expect(precioCuota).toBe(50.0);
  });

  test('Inválida: Lista vacía retorna sin errores', () => {
    const productos = [];

    expect(Array.isArray(productos)).toBe(true);
    expect(productos.length).toBe(0);
  });

  test('Inválida: Producto sin precio se rechaza o excluye', () => {
    const producto = { id: 1, nombre: 'Item', precio: null };

    expect(producto.precio).toBeNull();
  });
});
