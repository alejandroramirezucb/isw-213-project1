const { calcularPagoCuotas, validarNumeroCuotas, generarPlanPagos } = require('../server/utils-calculos');

describe('HU-15: Pago Flexible por Cuotas', () => {
  test('Válida: Cliente selecciona cuotas y ve desglose', () => {
    const monto = 1200;
    const cuotas = 6;
    const interes = 0.05;
    const montoCuota = calcularPagoCuotas(monto, cuotas, interes);
    expect(montoCuota).toBeGreaterThan(0);
  });

  test('Límite: Cuota máxima (24) genera plan completo', () => {
    const monto = 3000;
    const cuotas = 24;
    const plan = generarPlanPagos(monto, cuotas);
    expect(plan.length).toBe(24);
  });

  test('Inválida: No permitir 0 cuotas', () => {
    const valido = validarNumeroCuotas(0);
    expect(valido).toBe(false);
  });

  test('Inválida: Transacción fallida no genera plan', () => {
    const monto = 1200;
    const cuotas = 12;
    const resultado = generarPlanPagos(null, cuotas);
    expect(resultado).toEqual([]);
  });
});
