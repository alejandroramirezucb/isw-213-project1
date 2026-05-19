const { generarReporte, validarRangoFechas } = require('../server/utils-calculos');

describe('HU-14: Generación de Reportes', () => {
  test('Válida: Administrador genera reporte PDF con rango de fechas', () => {
    const inicio = new Date('2026-04-01');
    const fin = new Date('2026-04-30');
    const resultado = generarReporte(inicio, fin);
    expect(resultado).toBe(true);
  });

  test('Límite: Reporte con rango de un solo día se genera correctamente', () => {
    const fecha = new Date('2026-04-15');
    const resultado = generarReporte(fecha, fecha);
    expect(resultado).toBe(true);
  });

  test('Inválida: Rango con fecha inicio > fin es rechazado', () => {
    const inicio = new Date('2026-04-30');
    const fin = new Date('2026-04-01');
    const valido = validarRangoFechas(inicio, fin);
    expect(valido).toBe(false);
  });

  test('Inválida: Reporte sin ventas no falla', () => {
    const inicio = new Date('2099-01-01');
    const fin = new Date('2099-01-31');
    const resultado = generarReporte(inicio, fin);
    expect(resultado).toBe(true);
  });
});
