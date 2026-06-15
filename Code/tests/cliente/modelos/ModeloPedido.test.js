import { describe, it, expect, beforeEach, vi } from 'vitest';
import ModeloPedido from '../../../cliente/modelos/ModeloPedido.js';
import { capturarEvento } from '../../helpers/eventos.js';

describe('ModeloPedido', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('HU-02 Pago flexible por cuotas', () => {
    it('emite pedido:creado con los datos del pedido cuando el servicio responde', async () => {
      const pedidoServicio = { crear: vi.fn().mockResolvedValue({ id: 55, estado: 'recibido' }) };
      const modelo = new ModeloPedido(pedidoServicio, {});
      const evento = capturarEvento('pedido:creado');

      await modelo.crear({ pago: { metodo_pago: 'cuotas' } });

      expect(evento.detail).toEqual({ pedidoId: 55, estado: 'recibido', metodoPago: 'cuotas' });
    });

    it('emite pedido:error cuando el servicio lanza una excepción', async () => {
      const pedidoServicio = { crear: vi.fn().mockRejectedValue(new Error('sin stock')) };
      const modelo = new ModeloPedido(pedidoServicio, {});
      const evento = capturarEvento('pedido:error');

      await modelo.crear({});

      expect(evento.detail.mensaje).toBe('sin stock');
    });
  });

  describe('cargarAdmin', () => {
    it('emite pedido:listaCargada con los pedidos obtenidos', async () => {
      const pedidoServicio = { obtenerAdmin: vi.fn().mockResolvedValue([{ id: 1 }]) };
      const modelo = new ModeloPedido(pedidoServicio, {});
      const evento = capturarEvento('pedido:listaCargada');

      await modelo.cargarAdmin();

      expect(evento.detail.pedidos).toHaveLength(1);
    });
  });

  describe('HU-04 Seguimiento de estados del pedido', () => {
    it('emite pedido:historialCargado con los pedidos del usuario', async () => {
      const pedidoServicio = { obtenerHistorialUsuario: vi.fn().mockResolvedValue([{ id: 9 }]) };
      const modelo = new ModeloPedido(pedidoServicio, {});
      const evento = capturarEvento('pedido:historialCargado');

      await modelo.cargarHistorialUsuario({}, 'user-1');

      expect(evento.detail.pedidos).toEqual([{ id: 9 }]);
    });

    it('emite historial vacío cuando la consulta falla', async () => {
      const pedidoServicio = { obtenerHistorialUsuario: vi.fn().mockRejectedValue(new Error('error')) };
      const modelo = new ModeloPedido(pedidoServicio, {});
      const evento = capturarEvento('pedido:historialCargado');

      await modelo.cargarHistorialUsuario({}, 'user-1');

      expect(evento.detail.pedidos).toEqual([]);
    });
  });

  describe('avanzarEstado', () => {
    it('emite pedido:estadoCambiado con el nuevo estado', async () => {
      const pedidoServicio = { avanzarEstado: vi.fn().mockResolvedValue(undefined) };
      const modelo = new ModeloPedido(pedidoServicio, {});
      const evento = capturarEvento('pedido:estadoCambiado');

      await modelo.avanzarEstado(3, 'enviado');

      expect(evento.detail).toEqual({ pedidoId: 3, estadoNuevo: 'enviado' });
    });
  });
});
