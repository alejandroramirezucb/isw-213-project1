import { describe, it, expect } from 'vitest';
import CalculadorPrecio from '../cliente/utilidades/CalculadorPrecio.js';

describe('HU-01 Visualización de Productos', () => {
  it('formatea precio nulo como 0.00', () => {
    const precio = null;

    const resultado = CalculadorPrecio.formatearPrecio(precio);

    expect(resultado).toBe('0.00');
  });

  it('formatea precio válido con dos decimales', () => {
    const precio = 49.99;

    const resultado = CalculadorPrecio.formatearPrecio(precio);

    expect(resultado).toBe('49.99');
  });
});
