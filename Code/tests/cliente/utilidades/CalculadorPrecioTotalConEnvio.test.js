import { describe, it, expect } from 'vitest';
import CalculadorPrecio from '../../../cliente/utilidades/CalculadorPrecio.js';

describe('HU-06 calcular total con envio', () => {
  it('suma el costo de envío cuando el método es delivery', () => {
    const resultado = CalculadorPrecio.calcularTotalConEnvio(100, 'delivery');

    expect(resultado).toBe('115.00');
  });

  it('no suma costo cuando el metodo es recojo en almacén', () => {
    const resultado = CalculadorPrecio.calcularTotalConEnvio(100, 'recojo');

    expect(resultado).toBe('100.00');
  });
});
