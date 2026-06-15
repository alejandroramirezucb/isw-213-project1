import { describe, it, expect, beforeEach } from 'vitest';
import CarritoServicio from '../../../cliente/servicios/CarritoServicio.js';
import { unProducto } from '../../helpers/builders.js';

describe('CarritoServicio', () => {
  let servicio;

  beforeEach(() => {
    localStorage.clear();
    servicio = new CarritoServicio();
  });

  describe('HU-04 agregarProducto', () => {
    it('agrega un producto nuevo al carrito con éxito', () => {
      const resultado = servicio.agregarProducto(unProducto(), 1);

      expect(resultado.exito).toBe(true);
      expect(resultado.carrito).toHaveLength(1);
      expect(resultado.carrito[0].id).toBe(1);
    });

    it('acumula la cantidad al agregar un producto existente dentro del stock', () => {
      servicio.agregarProducto(unProducto({ stock: 5 }), 1);

      const resultado = servicio.agregarProducto(unProducto({ stock: 5 }), 2);

      expect(resultado.carrito[0].cantidad).toBe(3);
    });

    it('usa cantidad 1 por defecto cuando no se especifica', () => {
      const resultado = servicio.agregarProducto(unProducto());

      expect(resultado.carrito[0].cantidad).toBe(1);
    });

    it('usa la primera imagen del array cuando no hay imagen directa', () => {
      const resultado = servicio.agregarProducto(unProducto({ imagenes: ['url-imagen.jpg'] }), 1);

      expect(resultado.carrito[0].imagen).toBe('url-imagen.jpg');
    });

    it('guarda la imagen directa cuando el producto la tiene definida', () => {
      const resultado = servicio.agregarProducto(unProducto({ imagen: 'foto.jpg' }), 1);

      expect(resultado.carrito[0].imagen).toBe('foto.jpg');
    });

    it('asigna stock cero cuando el producto no tiene stock definido', () => {
      const resultado = servicio.agregarProducto({ id: 1, nombre: 'Monitor', precio: 250 }, 1);

      expect(resultado.carrito[0].stock).toBe(0);
    });
  });

  describe('HU-03 agregarProducto', () => {
    it('rechaza agregar cuando la nueva cantidad supera el stock', () => {
      servicio.agregarProducto(unProducto({ stock: 2 }), 1);

      const resultado = servicio.agregarProducto(unProducto({ stock: 2 }), 2);

      expect(resultado).toEqual({ exito: false, mensaje: 'Stock insuficiente' });
    });
  });

  describe('actualizarCantidad', () => {
    it('actualiza la cantidad cuando está dentro del stock disponible', () => {
      servicio.agregarProducto(unProducto({ stock: 5 }), 1);

      const resultado = servicio.actualizarCantidad(1, 3);

      expect(resultado.exito).toBe(true);
      expect(resultado.carrito[0].cantidad).toBe(3);
    });

    it('elimina el producto cuando la cantidad se actualiza a cero', () => {
      servicio.agregarProducto(unProducto({ stock: 5 }), 2);

      const carritoFinal = servicio.actualizarCantidad(1, 0);

      expect(carritoFinal).toEqual([]);
    });

    it('rechaza actualizar cuando supera el stock disponible', () => {
      servicio.agregarProducto(unProducto({ stock: 2 }), 1);

      const resultado = servicio.actualizarCantidad(1, 3);

      expect(resultado).toEqual({ exito: false, mensaje: 'Stock insuficiente', carrito: expect.any(Array) });
    });

    it('retorna el carrito sin cambios cuando el producto no existe', () => {
      servicio.agregarProducto(unProducto({ stock: 5 }), 1);

      const resultado = servicio.actualizarCantidad(999, 2);

      expect(resultado).toHaveLength(1);
    });
  });

  describe('eliminarProducto', () => {
    it('quita el producto indicado del carrito', () => {
      servicio.agregarProducto(unProducto({ id: 1 }), 1);
      servicio.agregarProducto(unProducto({ id: 2 }), 1);

      const resultado = servicio.eliminarProducto(1);

      expect(resultado).toHaveLength(1);
      expect(resultado[0].id).toBe(2);
    });
  });

  describe('totales', () => {
    it('calcula el precio total sumando precio por cantidad de cada producto', () => {
      servicio.agregarProducto(unProducto({ id: 1, precio: 100, stock: 10 }), 2);
      servicio.agregarProducto(unProducto({ id: 2, precio: 50, stock: 10 }), 3);

      expect(servicio.obtenerPrecioTotal()).toBe(350);
    });

    it('calcula la cantidad total sumando las unidades de todos los productos', () => {
      servicio.agregarProducto(unProducto({ id: 1, stock: 10 }), 2);
      servicio.agregarProducto(unProducto({ id: 2, stock: 10 }), 3);

      expect(servicio.obtenerCantidadTotal()).toBe(5);
    });

    it('vacía el carrito completamente al llamar limpiarCarrito', () => {
      servicio.agregarProducto(unProducto({ stock: 5 }), 2);

      servicio.limpiarCarrito();

      expect(servicio.obtenerCantidadTotal()).toBe(0);
    });
  });

  describe('obtenerCarrito', () => {
    it('retorna carrito vacío cuando localStorage contiene JSON inválido', () => {
      localStorage.setItem('raidencenter_carrito', 'json-invalido{{');

      const carrito = servicio.obtenerCarrito();

      expect(carrito).toEqual([]);
    });

    it('normaliza item usando campos alternativos cuando faltan los principales', () => {
      localStorage.setItem('raidencenter_carrito', JSON.stringify([
        { id: 1, name: 'Laptop', price: 500, quantity: 2, stock_disponible: 10 },
      ]));

      const carrito = servicio.obtenerCarrito();

      expect(carrito[0].nombre).toBe('Laptop');
      expect(carrito[0].precio).toBe(500);
      expect(carrito[0].cantidad).toBe(2);
      expect(carrito[0].stock).toBe(10);
    });

    it('normaliza item con valores por defecto cuando no tiene campos reconocidos', () => {
      localStorage.setItem('raidencenter_carrito', JSON.stringify([{ id: 99 }]));

      const carrito = servicio.obtenerCarrito();

      expect(carrito[0].nombre).toBe('');
      expect(carrito[0].precio).toBe(0);
      expect(carrito[0].cantidad).toBe(1);
      expect(carrito[0].stock).toBe(0);
    });
  });
});
