import { describe, it, expect, beforeEach } from 'vitest';
import CalculadorPrecio from '../cliente/utilidades/CalculadorPrecio.js';
import CarritoServicio from '../cliente/servicios/CarritoServicio.js';

describe('HU-04 Carrito de Compras', () => {
  let servicio;

  beforeEach(() => {
    localStorage.clear();
    servicio = new CarritoServicio();
  });

  it('calcula el subtotal multiplicando precio por cantidad', () => {
    const precio = 100;
    const cantidad = 2;

    const resultado = CalculadorPrecio.calcularSubtotal(precio, cantidad);

    expect(resultado).toBe('200.00');
  });

  it('agrega un producto nuevo al carrito con éxito', () => {
    const producto = { id: 1, nombre: 'Monitor', precio: 250, stock: 5 };

    const resultado = servicio.agregarProducto(producto, 1);

    expect(resultado.exito).toBe(true);
    expect(resultado.carrito).toHaveLength(1);
    expect(resultado.carrito[0].id).toBe(1);
  });

  it('acumula la cantidad al agregar un producto ya existente dentro del stock', () => {
    servicio.agregarProducto({ id: 1, nombre: 'Monitor', precio: 250, stock: 5 }, 1);

    const resultado = servicio.agregarProducto({ id: 1, nombre: 'Monitor', precio: 250, stock: 5 }, 2);

    expect(resultado.exito).toBe(true);
    expect(resultado.carrito[0].cantidad).toBe(3);
  });

  it('calcula el precio total sumando precio por cantidad de cada producto', () => {
    servicio.agregarProducto({ id: 1, nombre: 'Monitor', precio: 100, stock: 10 }, 2);
    servicio.agregarProducto({ id: 2, nombre: 'Teclado', precio: 50, stock: 10 }, 3);

    const total = servicio.obtenerPrecioTotal();

    expect(total).toBe(350);
  });

  it('calcula la cantidad total sumando las unidades de todos los productos', () => {
    servicio.agregarProducto({ id: 1, nombre: 'Monitor', precio: 100, stock: 10 }, 2);
    servicio.agregarProducto({ id: 2, nombre: 'Teclado', precio: 50, stock: 10 }, 3);

    const cantidad = servicio.obtenerCantidadTotal();

    expect(cantidad).toBe(5);
  });

  it('elimina el producto del carrito cuando la cantidad se actualiza a cero', () => {
    servicio.agregarProducto({ id: 1, nombre: 'Monitor', precio: 250, stock: 5 }, 2);

    const carritoFinal = servicio.actualizarCantidad(1, 0);

    expect(carritoFinal).toEqual([]);
  });
});
