import { describe, it, expect } from 'vitest';
import CalculadorPrecio from '../cliente/utilidades/CalculadorPrecio.js';

describe('HU-15 Pago Flexible por Cuotas', () => {
  it('calcula el monto por cuota con número de cuotas explícito', () => {
    const precio = 1200;
    const cuotas = 12;

    const resultado = CalculadorPrecio.calcularCuotas(precio, cuotas);

    expect(resultado).toBe('100.00');
  });

  it('calcula el monto por cuota usando las 12 cuotas por defecto', () => {
    const precio = 1200;

    const resultado = CalculadorPrecio.calcularCuotas(precio);

    expect(resultado).toBe('100.00');
  });
});
