export function unProducto(over = {}) {
  return {
    id: 1,
    nombre: 'Monitor',
    precio: 250,
    stock: 5,
    ...over,
  };
}

export function unItemCarrito(over = {}) {
  return {
    id: 1,
    nombre: 'Monitor',
    precio: 250,
    imagen: '',
    cantidad: 1,
    stock: 5,
    ...over,
  };
}

export function unInfoStock(over = {}) {
  return {
    id: 1,
    nombre: 'Monitor',
    stock: 5,
    disponible: true,
    ...over,
  };
}
