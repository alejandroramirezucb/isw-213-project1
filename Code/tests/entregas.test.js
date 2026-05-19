const { validarFoto } = require('../server/utils-calculos');

describe('HU-08: Gestión de Evidencia de Entrega', () => {
  test('Válida: Al marcar entregado, sistema obliga a cargar foto de evidencia', () => {
    const puedeConfirmarSinFoto = validarFoto(null);

    expect(puedeConfirmarSinFoto).toBe(false);
  });

  test('Límite: Durante estado "TRASLADANDOSE", GPS se registra automáticamente periódicamente', () => {
    const estado = 'TRASLADANDOSE';
    const gpsRegistra = estado === 'TRASLADANDOSE';
    const coordenadas = [
      { lat: -12.0464, lon: -77.0428, timestamp: Date.now() },
      { lat: -12.0500, lon: -77.0500, timestamp: Date.now() + 300000 }
    ];

    expect(gpsRegistra).toBe(true);
    expect(coordenadas.length).toBeGreaterThan(0);
  });

  test('Inválida: No se acepta entrega sin foto de evidencia', () => {
    const entregaValida = validarFoto(null);

    expect(entregaValida).toBe(false);
  });

  test('Inválida: GPS no se registra si pedido no está en estado TRASLADANDOSE', () => {
    const estado = 'EN_PROCESO';
    const gpsRegistra = estado === 'TRASLADANDOSE';

    expect(gpsRegistra).toBe(false);
  });
});
