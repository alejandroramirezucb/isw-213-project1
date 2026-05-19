const { estaEntrePlazo24h, validarFoto } = require('../server/utils-calculos');

describe('HU-16: Solicitud de Devolución', () => {
  test('Válida: Cliente puede solicitar devolución dentro de 24h mostrando foto de factura', () => {
    const fechaEntrega = new Date();
    const dentroDelPlazo = estaEntrePlazo24h(fechaEntrega);
    const fotoFacturaAdjunta = validarFoto('factura.jpg');

    expect(dentroDelPlazo).toBe(true);
    expect(fotoFacturaAdjunta).toBe(true);
  });

  test('Límite: Devolución es permitida exactamente en el minuto 24 de la hora 24', () => {
    const fechaEntrega = new Date(Date.now() - (24 * 60 * 60 * 1000));
    const permitida = estaEntrePlazo24h(fechaEntrega);

    expect(permitida).toBe(true);
  });

  test('Inválida: Pasadas 24h se desactiva el botón de devolución', () => {
    const fechaEntrega = new Date(Date.now() - (25 * 60 * 60 * 1000));
    const botónHabilitado = estaEntrePlazo24h(fechaEntrega);

    expect(botónHabilitado).toBe(false);
  });

  test('Inválida: Devolución sin foto de factura es rechazada', () => {
    const puedeEnviar = validarFoto(null);

    expect(puedeEnviar).toBe(false);
  });
});
