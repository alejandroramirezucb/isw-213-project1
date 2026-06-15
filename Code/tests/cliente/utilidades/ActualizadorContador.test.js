import { describe, it, expect, beforeEach, vi } from 'vitest';
import ActualizadorContador from '../../../cliente/utilidades/ActualizadorContador.js';

const CLASE_CONTADOR = 'barra-navegacion__contador-carrito';
const CLASE_ANIMADO = `${CLASE_CONTADOR}--animado`;

function montarContador() {
  document.body.innerHTML = `<span class="${CLASE_CONTADOR}"></span>`;
  return document.querySelector(`.${CLASE_CONTADOR}`);
}

function conCantidad(cantidad) {
  return { obtenerCantidadTotal: vi.fn().mockReturnValue(cantidad) };
}

describe('ActualizadorContador', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('escribe la cantidad total del carrito en el contador del navbar', () => {
    const contador = montarContador();

    new ActualizadorContador(conCantidad(3)).actualizar();

    expect(contador.textContent).toBe('3');
  });

  it('agrega la clase animada cuando hay productos en el carrito', () => {
    const contador = montarContador();

    new ActualizadorContador(conCantidad(2)).actualizar();

    expect(contador.classList.contains(CLASE_ANIMADO)).toBe(true);
  });

  it('no agrega la clase animada cuando el carrito está vacío', () => {
    const contador = montarContador();

    new ActualizadorContador(conCantidad(0)).actualizar();

    expect(contador.classList.contains(CLASE_ANIMADO)).toBe(false);
  });

  it('no falla cuando el contador no existe en el DOM', () => {
    expect(() => new ActualizadorContador(conCantidad(1)).actualizar()).not.toThrow();
  });
});
