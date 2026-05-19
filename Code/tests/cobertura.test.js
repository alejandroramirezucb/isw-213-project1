const {
  calcularDiferenciaHoras,
  permitirDevolución,
  calcularCostoEnvío,
  obtenerEstadoDisponibilidad,
  validarPedido
} = require('../server/utils-calculos');

describe('Cobertura adicional de utilidades', () => {
  test('calcularDiferenciaHoras: diferencia 1 hora', () => {
    const inicio = new Date();
    const fin = new Date(inicio.getTime() + 3600000);
    const resultado = calcularDiferenciaHoras(inicio, fin);

    expect(resultado).toBe(1);
  });

  test('calcularDiferenciaHoras: diferencia 24 horas', () => {
    const inicio = new Date();
    const fin = new Date(inicio.getTime() + 86400000);
    const resultado = calcularDiferenciaHoras(inicio, fin);

    expect(resultado).toBe(24);
  });

  test('permitirDevolución: válida', () => {
    const resultado = permitirDevolución('entregado', false);

    expect(resultado).toBe(true);
  });

  test('permitirDevolución: plazo vencido', () => {
    const resultado = permitirDevolución('entregado', true);

    expect(resultado).toBe(false);
  });

  test('permitirDevolución: estado cerrado válido', () => {
    const resultado = permitirDevolución('cerrado', false);

    expect(resultado).toBe(true);
  });

  test('permitirDevolución: estado inválido', () => {
    const resultado = permitirDevolución('en_proceso', false);

    expect(resultado).toBe(false);
  });

  test('calcularCostoEnvío: delivery', () => {
    const resultado = calcularCostoEnvío('delivery');

    expect(resultado).toBe(15);
  });

  test('calcularCostoEnvío: recojo', () => {
    const resultado = calcularCostoEnvío('recojo_almacen');

    expect(resultado).toBe(0);
  });

  test('obtenerEstadoDisponibilidad: disponible', () => {
    const resultado = obtenerEstadoDisponibilidad(15);

    expect(resultado).toBe('disponible');
  });

  test('obtenerEstadoDisponibilidad: bajo stock', () => {
    const resultado = obtenerEstadoDisponibilidad(5);

    expect(resultado).toBe('bajo_stock');
  });

  test('obtenerEstadoDisponibilidad: agotado', () => {
    const resultado = obtenerEstadoDisponibilidad(0);

    expect(resultado).toBe('agotado');
  });

  test('validarPedido: válido', () => {
    const resultado = validarPedido('user123', [{ producto_id: 1 }]);

    expect(resultado).toBe(true);
  });

  test('validarPedido: sin usuario', () => {
    const resultado = validarPedido(null, [{ producto_id: 1 }]);

    expect(resultado).toBe(false);
  });

  test('validarPedido: detalles vacío', () => {
    const resultado = validarPedido('user123', []);

    expect(resultado).toBe(false);
  });
});
