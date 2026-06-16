import { describe, it, expect } from 'vitest';
import GestorStock from '../../../cliente/utilidades/GestorStock.js';

describe('GestorStock', () => {
  describe('HU-12 requiere reposicion', () => {
    it('marca reposición cuando el stock está en el umbral', () => {
      const resultado = GestorStock.requiereReposicion(5, 5);

      expect(resultado).toBe(true);
    });

    it('marca reposición cuando el stock está por debajo del umbral', () => {
      const resultado = GestorStock.requiereReposicion(2, 5);

      expect(resultado).toBe(true);
    });

    it('no marca reposición cuando el stock supera el umbral', () => {
      const resultado = GestorStock.requiereReposicion(8, 5);

      expect(resultado).toBe(false);
    });

    it('usa el umbral por defecto cuando no se especifica', () => {
      const resultado = GestorStock.requiereReposicion(5);

      expect(resultado).toBe(true);
    });
  });
});
