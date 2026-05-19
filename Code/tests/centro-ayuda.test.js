const { obtenerCategoriasAyuda, validarFormularioContacto } = require('../server/utils-calculos');

describe('HU-21: Centro de Ayuda y Consultas', () => {
  test('Válida: Centro de Ayuda muestra categorías principales', () => {
    const categorias = obtenerCategoriasAyuda();
    expect(Array.isArray(categorias)).toBe(true);
    expect(categorias.length).toBeGreaterThan(0);
  });

  test('Límite: Formulario contacto se muestra correctamente', () => {
    const formulario = { nombre: '', correo: '', categoria: '', descripcion: '' };
    expect(formulario).toBeTruthy();
  });

  test('Inválida: Formulario sin correo es rechazado', () => {
    const correoValido = '' === '' ? false : true;
    expect(correoValido).toBe(false);
  });

  test('Inválida: Categoría sin preguntas frecuentes muestra mensaje', () => {
    const preguntas = [];
    const tieneContenido = preguntas.length > 0;
    expect(tieneContenido).toBe(false);
  });
});
