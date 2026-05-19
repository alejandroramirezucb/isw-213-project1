const { obtenerRutaChofer, obtenerHoraLlegada, verificarGPS } = require('../server/utils-calculos');

describe('HU-20: Monitoreo de Rutas', () => {
  test('Válida: Administrador ve mapa con ruta completa al finalizar jornada', () => {
    const choferId = 1;
    const ruta = obtenerRutaChofer(choferId);
    expect(Array.isArray(ruta)).toBe(true);
    expect(ruta.length).toBeGreaterThan(0);
  });

  test('Límite: Hora exacta de llegada al domicilio es visible', () => {
    const pedidoId = 1;
    const hora = obtenerHoraLlegada(pedidoId);
    expect(hora).toBeTruthy();
  });

  test('Inválida: GPS desactivado muestra advertencia sin fallar', () => {
    const choferId = 1;
    const ruta = obtenerRutaChofer(choferId);
    expect(Array.isArray(ruta)).toBe(true);
  });

  test('Inválida: Chofer sin entregas no genera error de ruta vacía', () => {
    const choferId = 999;
    const ruta = obtenerRutaChofer(choferId);
    expect(Array.isArray(ruta)).toBe(true);
    expect(ruta.length).toBe(0);
  });
});
