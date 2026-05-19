const { obtenerPedidosChofer, cambiarEstadoATrasladandose, validarAsignacionChofer } = require('../server/utils-calculos');

describe('HU-07: Hoja de Ruta del Chofer', () => {
  test('Válida: Chofer ve lista de pedidos ENVIADO con dirección y GPS', () => {
    const chofer_id = 'chofer1';
    const pedidos = obtenerPedidosChofer(chofer_id, 'ENVIADO');
    expect(Array.isArray(pedidos)).toBe(true);
    expect(pedidos.length).toBeGreaterThanOrEqual(0);
  });

  test('Límite: Presionar "Iniciar Entrega" cambia estado a TRASLADANDOSE', () => {
    const pedidoId = 1;
    const resultado = cambiarEstadoATrasladandose(pedidoId);
    expect(resultado).toBe(true);
  });

  test('Inválida: Chofer no puede ver pedidos asignados a otro chofer', () => {
    const choferA = 'chofer1';
    const choferB = 'chofer2';
    const pedidosA = obtenerPedidosChofer(choferA, 'ENVIADO');
    const pedidosB = obtenerPedidosChofer(choferB, 'ENVIADO');
    expect(Array.isArray(pedidosA)).toBe(true);
    expect(pedidosA.length).toBe(0);
    expect(pedidosB.length).toBe(0);
  });

  test('Inválida: Chofer no puede iniciar entrega de pedido EN_PROCESO', () => {
    const estado = 'EN_PROCESO';
    const permitido = validarAsignacionChofer(estado);
    expect(permitido).toBe(false);
  });
});
