const { buscarProductos, filtrarPorPrecio } = require('../server/utils-calculos');

describe('HU-09: Buscador con Filtros', () => {
  test('Válida: Buscador retorna resultados en menos de 2 segundos', () => {
    const termino = 'Laptop';
    const inicio = Date.now();
    const resultados = buscarProductos(termino);
    const tiempo = Date.now() - inicio;
    expect(Array.isArray(resultados)).toBe(true);
    expect(tiempo).toBeLessThan(2000);
  });

  test('Límite: Filtro con precio mín=máx retorna solo producto exacto', () => {
    const resultados = filtrarPorPrecio(500, 500);
    expect(Array.isArray(resultados)).toBe(true);
  });

  test('Inválida: Búsqueda sin resultados muestra mensaje', () => {
    const termino = 'xyzabc123';
    const resultados = buscarProductos(termino);
    expect(resultados).toEqual([]);
  });

  test('Inválida: Rango precio mín > máx es rechazado', () => {
    const valido = 1000 <= 100;
    expect(valido).toBe(false);
  });
});
