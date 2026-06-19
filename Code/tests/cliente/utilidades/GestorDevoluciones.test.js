import { describe, it, expect } from 'vitest';
import GestorDevoluciones from '../../../cliente/utilidades/GestorDevoluciones.js';

describe('GestorDevoluciones', () => {
  describe('HU-03 puede solicitar devolucion', () => {
    it('permite la devolución cuando han pasado menos de 24 horas desde la entrega', () => {
      const entrega = new Date('2026-06-19T08:00:00Z');
      const ahora = new Date('2026-06-19T18:00:00Z');

      const resultado = GestorDevoluciones.puedeSolicitar(entrega, ahora);

      expect(resultado).toBe(true);
    });

    it('rechaza la devolución cuando han pasado más de 24 horas desde la entrega', () => {
      const entrega = new Date('2026-06-18T08:00:00Z');
      const ahora = new Date('2026-06-19T14:00:00Z');

      const resultado = GestorDevoluciones.puedeSolicitar(entrega, ahora);

      expect(resultado).toBe(false);
    });

    it('rechaza la devolución cuando han pasado exactamente 24 horas', () => {
      const entrega = new Date('2026-06-18T08:00:00Z');
      const ahora = new Date('2026-06-19T08:00:00Z');

      const resultado = GestorDevoluciones.puedeSolicitar(entrega, ahora);

      expect(resultado).toBe(false);
    });
  });
});
