import CalculadorPrecio from '../utilidades/CalculadorPrecio.js';

class VistaCarrito {
  static COSTO_DELIVERY = 15;

  constructor() {
    document.addEventListener('carrito:modificado', (e) => this._renderizar(e.detail));
  }

  _renderizar({ carrito, precioTotal }) {
    const contenedor = document.getElementById('lista-carrito');
    if (!contenedor) return;

    if (carrito.length === 0) {
      this._renderizarVacio(contenedor);
      return;
    }

    this._renderizarItems(contenedor, carrito);
    this._renderizarResumen(carrito, precioTotal);
  }

  _renderizarVacio(contenedor) {
    while (contenedor.firstChild) contenedor.removeChild(contenedor.firstChild);

    const divVacio = document.createElement('div');
    divVacio.className = 'carrito-vacio';

    const h3 = document.createElement('h3');
    h3.textContent = 'Tu carrito está vacío';
    divVacio.appendChild(h3);

    const p = document.createElement('p');
    p.textContent = 'Agrega productos para comenzar a comprar';
    divVacio.appendChild(p);

    const enlace = document.createElement('a');
    enlace.href = '/';
    enlace.className = 'btn-primary';
    enlace.textContent = 'Ir a la tienda';
    divVacio.appendChild(enlace);

    contenedor.appendChild(divVacio);
    const elementoTotal = document.getElementById('total-precio');
    if (elementoTotal) elementoTotal.textContent = 'Bs. 0.00';
  }

  _renderizarItems(contenedor, carrito) {
    while (contenedor.firstChild) contenedor.removeChild(contenedor.firstChild);

    carrito.forEach((producto) => {
      contenedor.appendChild(this._crearItemCarrito(producto));
    });
  }

  _crearItemCarrito(producto) {
    const stock = producto.stock || 999;
    const subtotal = CalculadorPrecio.calcularSubtotal(producto.precio, producto.cantidad);

    const divItem = document.createElement('div');
    divItem.className = 'item-carrito';

    const img = document.createElement('img');
    img.src = producto.imagen || '';
    img.alt = producto.nombre || '';
    divItem.appendChild(img);

    const divInfo = document.createElement('div');
    divInfo.className = 'item-carrito__info';

    const divNombre = document.createElement('div');
    divNombre.className = 'item-carrito__nombre';
    divNombre.textContent = producto.nombre || '';
    divInfo.appendChild(divNombre);

    const divPrecio = document.createElement('div');
    divPrecio.className = 'item-carrito__precio';
    divPrecio.textContent = `Bs. ${CalculadorPrecio.formatearPrecio(producto.precio)}`;
    divInfo.appendChild(divPrecio);

    const divStock = document.createElement('div');
    divStock.className = 'item-carrito__stock';
    divStock.textContent = `Stock disponible: ${stock} unidades`;
    divInfo.appendChild(divStock);

    const divSubtotal = document.createElement('div');
    divSubtotal.className = 'item-carrito__subtotal';
    divSubtotal.textContent = `Subtotal: Bs. ${subtotal}`;
    divInfo.appendChild(divSubtotal);

    divItem.appendChild(divInfo);

    const divControles = document.createElement('div');
    divControles.className = 'item-carrito__controles';

    const divCantidad = document.createElement('div');
    divCantidad.className = 'cantidad-controles';

    const btnMenos = document.createElement('button');
    btnMenos.textContent = '-';
    btnMenos.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('carrito:cantidadSolicitada', {
        detail: { productoId: producto.id, cambio: -1, nombre: producto.nombre },
      }));
    });
    divCantidad.appendChild(btnMenos);

    const inputCantidad = document.createElement('input');
    inputCantidad.type = 'number';
    inputCantidad.value = producto.cantidad;
    inputCantidad.min = '1';
    inputCantidad.max = String(stock);
    inputCantidad.addEventListener('change', () => {
      document.dispatchEvent(new CustomEvent('carrito:cantidadDirecta', {
        detail: { productoId: producto.id, cantidad: inputCantidad.value },
      }));
    });
    divCantidad.appendChild(inputCantidad);

    const btnMas = document.createElement('button');
    btnMas.textContent = '+';
    btnMas.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('carrito:cantidadSolicitada', {
        detail: { productoId: producto.id, cambio: 1, nombre: producto.nombre },
      }));
    });
    divCantidad.appendChild(btnMas);

    divControles.appendChild(divCantidad);

    const btnEliminar = document.createElement('button');
    btnEliminar.className = 'btn-eliminar';
    btnEliminar.textContent = 'Eliminar';
    btnEliminar.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('carrito:eliminacionSolicitada', {
        detail: { productoId: producto.id, nombre: producto.nombre },
      }));
    });
    divControles.appendChild(btnEliminar);

    divItem.appendChild(divControles);
    return divItem;
  }

  _renderizarResumen(carrito, precioProductos) {
    const metodo = this._obtenerMetodoEntrega();
    const costoEnvio = metodo === 'delivery' ? VistaCarrito.COSTO_DELIVERY : 0;
    const precioTotal = precioProductos + costoEnvio;
    const cantidadTotal = carrito.reduce((t, i) => t + i.cantidad, 0);

    const contenedorResumen = document.getElementById('resumen-detalle');
    if (!contenedorResumen) {
      const elementoTotal = document.getElementById('total-precio');
      if (elementoTotal) elementoTotal.textContent = `Bs. ${precioTotal.toFixed(2)}`;
      return;
    }

    while (contenedorResumen.firstChild) contenedorResumen.removeChild(contenedorResumen.firstChild);

    const divResumenTotal = document.createElement('div');
    divResumenTotal.className = 'resumen-total';

    divResumenTotal.appendChild(this._crearLineaResumen('Productos:', `${cantidadTotal} unidad${cantidadTotal !== 1 ? 'es' : ''}`));

    const spanEnvioVal = document.createElement('span');
    if (costoEnvio > 0) {
      spanEnvioVal.textContent = `Bs. ${costoEnvio.toFixed(2)}`;
    } else {
      spanEnvioVal.className = 'resumen-envio-gratis';
      spanEnvioVal.textContent = 'Gratis';
    }
    const lineaEnvio = this._crearLineaResumen('Costo de envío:', '');
    lineaEnvio.replaceChild(spanEnvioVal, lineaEnvio.lastChild);
    divResumenTotal.appendChild(lineaEnvio);

    const lineaTotal = this._crearLineaResumen('Total:', `Bs. ${precioTotal.toFixed(2)}`);
    lineaTotal.className = 'resumen-linea total';
    lineaTotal.lastChild.id = 'total-precio';
    divResumenTotal.appendChild(lineaTotal);

    contenedorResumen.appendChild(divResumenTotal);
  }

  _crearLineaResumen(etiqueta, valor) {
    const div = document.createElement('div');
    div.className = 'resumen-linea';
    const spanLabel = document.createElement('span');
    spanLabel.textContent = etiqueta;
    const spanVal = document.createElement('span');
    spanVal.textContent = valor;
    div.appendChild(spanLabel);
    div.appendChild(spanVal);
    return div;
  }

  _obtenerMetodoEntrega() {
    const nodo = document.querySelector('input[name="metodo-entrega"]:checked');
    return nodo ? nodo.value : 'recojo_almacen';
  }
}

export default VistaCarrito;
