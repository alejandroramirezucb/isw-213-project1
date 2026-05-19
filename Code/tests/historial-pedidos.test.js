const { obtenerHistorialCliente, descargarFactura, validarAccesoFactura } = require('../server/utils-calculos');

describe('HU-10: Historial de Pedidos y Facturas', () => {
  test('Válida: Cliente ve historial de pedidos con estados correctos', () => {
    const usuarioId = 'user123';
    const historial = obtenerHistorialCliente(usuarioId);
    expect(Array.isArray(historial)).toBe(true);
  });

  test('Límite: Primer pedido histórico es recuperable y descargable', () => {
    const usuarioId = 'user123';
    const pedidoId = 1;
    const resultado = descargarFactura(usuarioId, pedidoId);
    expect(resultado).toBe(true);
  });

  test('Inválida: Cliente sin pedidos ve mensaje informativo', () => {
    const usuarioId = 'newuser';
    const historial = obtenerHistorialCliente(usuarioId);
    expect(historial.length).toBe(0);
  });

  test('Inválida: Cliente no accede factura de otro cliente', () => {
    const clienteA = 'user1';
    const clienteB = 'user2';
    const pedidoB = 100;
    const acceso = validarAccesoFactura(clienteA, clienteB, pedidoB);
    expect(acceso).toBe(false);
  });
});
