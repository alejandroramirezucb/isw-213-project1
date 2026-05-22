import { describe, it, expect, beforeEach } from 'vitest';
import CarritoServicio from '../cliente/servicios/CarritoServicio.js';

describe('HU-03 Gestión de Stock', () => {
  let servicio;

  beforeEach(() => {
    localStorage.clear();
    servicio = new CarritoServicio();
  });

  it('rechaza agregar cuando la nueva cantidad supera el stock del producto existente', () => {
    servicio.agregarProducto({ id: 1, nombre: 'Laptop', precio: 800, stock: 2 }, 1);

    const resultado = servicio.agregarProducto({ id: 1, nombre: 'Laptop', precio: 800, stock: 2 }, 2);

    expect(resultado).toEqual({ exito: false, mensaje: 'Stock insuficiente' });
  });

  it('rechaza actualizar cantidad cuando supera el stock disponible', () => {
    servicio.agregarProducto({ id: 1, nombre: 'Laptop', precio: 800, stock: 2 }, 1);

    const resultado = servicio.actualizarCantidad(1, 3);

    expect(resultado).toEqual({ exito: false, mensaje: 'Stock insuficiente', carrito: expect.any(Array) });
  });
});
