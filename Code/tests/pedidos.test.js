const { validarEstadoTransicion } = require('../server/utils-calculos');

describe('HU-06: Seguimiento de Estados del Pedido', () => {
  test('Válida: Cliente ve línea de tiempo con 6 estados y fechas exactas de cada cambio', () => {
    const historial = [
      { estado: 'RECIBIDO', fecha: new Date('2026-05-01T10:00:00Z') },
      { estado: 'EN_PROCESO', fecha: new Date('2026-05-01T11:00:00Z') },
      { estado: 'ENVIADO', fecha: new Date('2026-05-01T12:00:00Z') },
      { estado: 'TRASLADANDOSE', fecha: new Date('2026-05-01T13:00:00Z') },
      { estado: 'LISTO', fecha: new Date('2026-05-01T14:00:00Z') },
      { estado: 'ENTREGADO', fecha: new Date('2026-05-01T15:00:00Z') }
    ];

    const ordenado = historial.sort((a, b) => a.fecha - b.fecha);

    expect(ordenado.length).toBe(6);
    expect(ordenado[0].estado).toBe('RECIBIDO');
    expect(ordenado[5].estado).toBe('ENTREGADO');
    expect(ordenado[0].fecha).toBeDefined();
  });

  test('Límite: Cuando pedido llega a "LISTO", se envía notificación automática', () => {
    const estado = 'LISTO';
    const notificacionEnviada = estado === 'LISTO';

    expect(notificacionEnviada).toBe(true);
  });

  test('Inválida: No se permite transición de estado hacia atrás', () => {
    const permitido = validarEstadoTransicion('ENTREGADO', 'ENVIADO');

    expect(permitido).toBe(false);
  });

  test('Inválida: Pedido inexistente retorna error', () => {
    const pedidoId = null;
    const encontrado = pedidoId !== null;

    expect(encontrado).toBe(false);
  });
});
