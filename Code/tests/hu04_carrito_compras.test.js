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

  it('actualiza la cantidad correctamente cuando está dentro del stock disponible', () => {
    servicio.agregarProducto({ id: 1, nombre: 'Monitor', precio: 250, stock: 5 }, 1);

    const resultado = servicio.actualizarCantidad(1, 3);

    expect(resultado.exito).toBe(true);
    expect(resultado.carrito[0].cantidad).toBe(3);
  });

  it('retorna el carrito sin cambios cuando el producto no existe en él', () => {
    servicio.agregarProducto({ id: 1, nombre: 'Monitor', precio: 250, stock: 5 }, 1);

    const resultado = servicio.actualizarCantidad(999, 2);

    expect(resultado).toHaveLength(1);
  });

  it('vacía el carrito completamente al llamar limpiarCarrito', () => {
    servicio.agregarProducto({ id: 1, nombre: 'Monitor', precio: 250, stock: 5 }, 2);

    servicio.limpiarCarrito();

    expect(servicio.obtenerCantidadTotal()).toBe(0);
  });

  it('retorna carrito vacío cuando localStorage contiene JSON inválido', () => {
    localStorage.setItem('raidencenter_carrito', 'json-invalido{{');

    const carrito = servicio.obtenerCarrito();

    expect(carrito).toEqual([]);
  });

  it('calcula subtotal como cero cuando precio y cantidad son nulos', () => {
    const resultado = CalculadorPrecio.calcularSubtotal(null, null);

    expect(resultado).toBe('0.00');
  });

  it('usa cantidad 1 por defecto cuando no se especifica al agregar producto', () => {
    const producto = { id: 1, nombre: 'Monitor', precio: 250, stock: 5 };

    const resultado = servicio.agregarProducto(producto);

    expect(resultado.carrito[0].cantidad).toBe(1);
  });

  it('normaliza item usando campos alternativos cuando faltan los campos principales', () => {
    localStorage.setItem('raidencenter_carrito', JSON.stringify([
      { id: 1, name: 'Laptop', price: 500, quantity: 2, stock_disponible: 10 },
    ]));

    const carrito = servicio.obtenerCarrito();

    expect(carrito[0].nombre).toBe('Laptop');
    expect(carrito[0].precio).toBe(500);
    expect(carrito[0].cantidad).toBe(2);
    expect(carrito[0].stock).toBe(10);
  });

  it('usa primera imagen del array cuando el producto no tiene imagen directa', () => {
    const producto = { id: 1, nombre: 'Monitor', precio: 250, stock: 5, imagenes: ['url-imagen.jpg'] };

    const resultado = servicio.agregarProducto(producto, 1);

    expect(resultado.carrito[0].imagen).toBe('url-imagen.jpg');
  });

  it('guarda la imagen directa cuando el producto la tiene definida', () => {
    const producto = { id: 1, nombre: 'Monitor', precio: 250, stock: 5, imagen: 'foto.jpg' };

    const resultado = servicio.agregarProducto(producto, 1);

    expect(resultado.carrito[0].imagen).toBe('foto.jpg');
  });

  it('asigna stock cero cuando el producto no tiene stock definido', () => {
    const producto = { id: 1, nombre: 'Monitor', precio: 250 };

    const resultado = servicio.agregarProducto(producto, 1);

    expect(resultado.carrito[0].stock).toBe(0);
  });

  it('normaliza item con valores por defecto cuando no tiene ningún campo reconocido', () => {
    localStorage.setItem('raidencenter_carrito', JSON.stringify([{ id: 99 }]));

    const carrito = servicio.obtenerCarrito();

    expect(carrito[0].nombre).toBe('');
    expect(carrito[0].precio).toBe(0);
    expect(carrito[0].cantidad).toBe(1);
    expect(carrito[0].stock).toBe(0);
  });
});
