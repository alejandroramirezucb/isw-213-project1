const { permitirConfirmacionRecepcion, cambiarEstadoCerrado, validarEstadoEntregado } = require('../server/utils-calculos');

describe('HU-12: Confirmación de Finalización del Pedido', () => {
  test('Válida: Cliente confirma recepción y pedido pasa a CERRADO', () => {
    const estado = 'ENTREGADO';
    const resultado = cambiarEstadoCerrado('CERRADO');
    expect(resultado).toBe(true);
  });

  test('Límite: Botón confirmación aparece después de ENTREGADO', () => {
    const estado = 'ENTREGADO';
    const permitido = permitirConfirmacionRecepcion(estado);
    expect(permitido).toBe(true);
  });

  test('Inválida: No confirmar recepción antes de ENTREGADO', () => {
    const estado = 'LISTO_PARA_ENTREGARSE';
    const permitido = permitirConfirmacionRecepcion(estado);
    expect(permitido).toBe(false);
  });

  test('Inválida: No confirmar dos veces', () => {
    const estado1 = 'CERRADO';
    const permitido = permitirConfirmacionRecepcion(estado1);
    expect(permitido).toBe(false);
  });
});
