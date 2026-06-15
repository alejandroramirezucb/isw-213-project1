import { describe, it, expect } from 'vitest';
import CalculadorPrecio from '../../../cliente/utilidades/CalculadorPrecio.js';

describe('CalculadorPrecio', () => {
  describe('HU-01 formatear fecha', () => {
    it('formatea precio nulo como 0.00', () => {
      const resultado = CalculadorPrecio.formatearPrecio(null);

      expect(resultado).toBe('0.00');
    });

    it('formatea precio válido con dos decimales', () => {
      const resultado = CalculadorPrecio.formatearPrecio(49.99);

      expect(resultado).toBe('49.99');
    });
  });

  describe('HU-04 calcularSubtotal', () => {
    it('multiplica precio por cantidad', () => {
      const resultado = CalculadorPrecio.calcularSubtotal(100, 2);

      expect(resultado).toBe('200.00');
    });

    it('devuelve 0.00 cuando precio y cantidad son nulos', () => {
      const resultado = CalculadorPrecio.calcularSubtotal(null, null);

      expect(resultado).toBe('0.00');
    });
  });

  describe('HU-15 calcular cuotas', () => {
    it('calcula el monto por cuota con número de cuotas explícito', () => {
      const resultado = CalculadorPrecio.calcularCuotas(1200, 12);

      expect(resultado).toBe('100.00');
    });

    it('usa 12 cuotas por defecto cuando no se especifica', () => {
      const resultado = CalculadorPrecio.calcularCuotas(1200);

      expect(resultado).toBe('100.00');
    });
  });
});
