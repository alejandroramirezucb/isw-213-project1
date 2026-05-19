const { validarProducto, verificarActualizacionPrecio } = require('../server/utils-calculos');

describe('HU-02: Gestión de Catálogo de Productos', () => {
  test('Válida: Administrador crea producto con categoría, foto, descripción y precio', () => {
    const producto = {
      nombre: 'Televisor 50"',
      categoria: 'Electrónica',
      precio: 2500.0,
      descripcion: 'Smart TV 4K',
      foto: 'tv.jpg'
    };
    const valido = validarProducto(producto);
    expect(valido).toBe(true);
  });

  test('Límite: Actualizar precio se refleja en tiempo real para usuarios', () => {
    const precioAnterior = 1000;
    const precioNuevo = 999.99;
    const actualizado = verificarActualizacionPrecio(precioAnterior, precioNuevo);
    expect(actualizado).toBe(true);
  });

  test('Inválida: No se puede crear producto sin nombre', () => {
    const producto = { nombre: '', precio: 500, categoria: 'Electrónica' };
    const valido = validarProducto(producto);
    expect(valido).toBe(false);
  });

  test('Inválida: No se puede crear producto con precio negativo', () => {
    const producto = { nombre: 'Laptop', precio: -100, categoria: 'Electrónica' };
    const valido = validarProducto(producto);
    expect(valido).toBe(false);
  });
});
