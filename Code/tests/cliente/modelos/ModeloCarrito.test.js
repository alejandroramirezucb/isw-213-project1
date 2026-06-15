import { describe, it, expect, beforeEach, vi } from 'vitest';
import ModeloCarrito from '../../../cliente/modelos/ModeloCarrito.js';
import { unItemCarrito, unInfoStock } from '../../helpers/builders.js';
import { capturarEvento } from '../../helpers/eventos.js';

function unCarritoServicio(over = {}) {
  return {
    obtenerCarrito: vi.fn().mockReturnValue([]),
    guardarCarrito: vi.fn(),
    agregarProducto: vi.fn(),
    eliminarProducto: vi.fn(),
    actualizarCantidad: vi.fn(),
    vaciarCarrito: vi.fn(),
    obtenerPrecioTotal: vi.fn().mockReturnValue(0),
    ...over,
  };
}

describe('HU-04 Carrito de Compras', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('agregar', () => {
    it('emite carrito:modificado cuando el producto se agrega con exito', () => {
      const carritoServicio = unCarritoServicio({
        agregarProducto: vi.fn().mockReturnValue({ exito: true, carrito: [unItemCarrito()] }),
      });
      const modelo = new ModeloCarrito(carritoServicio, {});
      const evento = capturarEvento('carrito:modificado');

      modelo.agregar(unItemCarrito(), 1);

      expect(evento.detail.cantidadTotal).toBe(1);
    });

    it('emite carrito:stockInsuficiente cuando el servicio rechaza por stock', () => {
      const carritoServicio = unCarritoServicio({
        agregarProducto: vi.fn().mockReturnValue({ exito: false }),
      });
      const modelo = new ModeloCarrito(carritoServicio, {});
      const evento = capturarEvento('carrito:stockInsuficiente');

      modelo.agregar({ id: 7, stock: 2 }, 1);

      expect(evento.detail).toEqual({ productoId: 7, stockDisponible: 2 });
    });
  });

  describe('actualizarCantidad', () => {
    it('emite carrito:modificado cuando la actualización es válida', () => {
      const carritoServicio = unCarritoServicio({
        actualizarCantidad: vi.fn().mockReturnValue({ exito: true, carrito: [unItemCarrito({ cantidad: 3 })] }),
      });
      const modelo = new ModeloCarrito(carritoServicio, {});
      const evento = capturarEvento('carrito:modificado');

      modelo.actualizarCantidad(1, 3);

      expect(evento.detail.cantidadTotal).toBe(3);
    });

    it('emite carrito:stockInsuficiente con el stock del item rechazado', () => {
      const carritoServicio = unCarritoServicio({
        actualizarCantidad: vi.fn().mockReturnValue({ exito: false, carrito: [unItemCarrito({ id: 1, stock: 2 })] }),
      });
      const modelo = new ModeloCarrito(carritoServicio, {});
      const evento = capturarEvento('carrito:stockInsuficiente');

      modelo.actualizarCantidad(1, 9);

      expect(evento.detail).toEqual({ productoId: 1, stockDisponible: 2 });
    });

    it('emite carrito:modificado cuando el servicio devuelve un arreglo directo', () => {
      const carritoServicio = unCarritoServicio({
        actualizarCantidad: vi.fn().mockReturnValue([unItemCarrito({ cantidad: 2 })]),
      });
      const modelo = new ModeloCarrito(carritoServicio, {});
      const evento = capturarEvento('carrito:modificado');

      modelo.actualizarCantidad(1, 2);

      expect(evento.detail.cantidadTotal).toBe(2);
    });
  });

  describe('eliminar', () => {
    it('emite carrito:modificado con el carrito resultante', () => {
      const carritoServicio = unCarritoServicio({
        eliminarProducto: vi.fn().mockReturnValue([]),
      });
      const modelo = new ModeloCarrito(carritoServicio, {});
      const evento = capturarEvento('carrito:modificado');

      modelo.eliminar(1);

      expect(evento.detail.cantidadTotal).toBe(0);
    });
  });

  describe('vaciar', () => {
    it('vacía el servicio y emite carrito:modificado vacío', () => {
      const carritoServicio = unCarritoServicio();
      const modelo = new ModeloCarrito(carritoServicio, {});
      const evento = capturarEvento('carrito:modificado');

      modelo.vaciar();

      expect(carritoServicio.vaciarCarrito).toHaveBeenCalled();
      expect(evento.detail.carrito).toEqual([]);
    });
  });

  describe('obtener', () => {
    it('emite el carrito directamente cuando está vacío', async () => {
      const carritoServicio = unCarritoServicio({ obtenerCarrito: vi.fn().mockReturnValue([]) });
      const modelo = new ModeloCarrito(carritoServicio, {});
      const evento = capturarEvento('carrito:modificado');

      await modelo.obtener();

      expect(evento.detail.carrito).toEqual([]);
    });

    it('ajusta la cantidad cuando el stock disponible es menor al del carrito', async () => {
      const carritoServicio = unCarritoServicio({
        obtenerCarrito: vi.fn().mockReturnValue([unItemCarrito({ cantidad: 5 })]),
      });
      const productoServicio = {
        verificarStock: vi.fn().mockResolvedValue(unInfoStock({ stock: 2, disponible: true })),
      };
      const modelo = new ModeloCarrito(carritoServicio, productoServicio);
      const evento = capturarEvento('carrito:modificado');

      await modelo.obtener();

      expect(evento.detail.carrito[0].cantidad).toBe(2);
    });

    it('elimina del carrito el producto que ya no está disponible', async () => {
      const carritoServicio = unCarritoServicio({
        obtenerCarrito: vi.fn().mockReturnValue([unItemCarrito()]),
      });
      const productoServicio = {
        verificarStock: vi.fn().mockResolvedValue(unInfoStock({ disponible: false, stock: 0 })),
      };
      const modelo = new ModeloCarrito(carritoServicio, productoServicio);
      const evento = capturarEvento('carrito:modificado');

      await modelo.obtener();

      expect(evento.detail.carrito).toEqual([]);
    });

    it('conserva el item cuando la verificación de stock falla', async () => {
      const carritoServicio = unCarritoServicio({
        obtenerCarrito: vi.fn().mockReturnValue([unItemCarrito()]),
      });
      const productoServicio = {
        verificarStock: vi.fn().mockRejectedValue(new Error('red caída')),
      };
      const modelo = new ModeloCarrito(carritoServicio, productoServicio);
      const evento = capturarEvento('carrito:modificado');

      await modelo.obtener();

      expect(evento.detail.carrito).toHaveLength(1);
    });
  });
});
