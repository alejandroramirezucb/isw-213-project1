import { describe, it, expect } from 'vitest';
import CalculadorPrecio from '../../../cliente/utilidades/CalculadorPrecio.js';

describe('HU-02 CalculadorPrecio.calcularCuotaConInteres', () => {
  it('aplica el interés al total antes de dividir entre las cuotas', () => {
    const resultado = CalculadorPrecio.calcularCuotaConInteres(1000, 10, 0.2);

    expect(resultado).toBe('120.00');
  });

  it('equivale a la cuota simple cuando el interés es cero', () => {
    const resultado = CalculadorPrecio.calcularCuotaConInteres(1200, 12, 0);

    expect(resultado).toBe('100.00');
  });
});
