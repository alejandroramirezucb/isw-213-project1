var productoServicio = new ProductoServicio();
var carritoServicio = new CarritoServicio();
var actualizadorContador = new ActualizadorContador(carritoServicio);
var stockVerificadoEnSesion = false;
var COSTO_DELIVERY = 15;

document.addEventListener('DOMContentLoaded', function () {
  cargarNavbar().then(function () {
    obtenerClienteSupabase().then(function () {
      mostrarCarrito();
      configurarBotonFinalizar();
      configurarEventosPago();
      configurarMetodoEntrega();
    });
  });
});

function configurarMetodoEntrega() {
  var radios = document.querySelectorAll('input[name="metodo-entrega"]');
  radios.forEach(function (radio) {
    radio.addEventListener('change', function () {
      var campoDir = document.getElementById('campo-direccion');
      var infoAlmacen = document.getElementById('info-almacen');
      var esDelivery = radio.value === 'delivery';

      if (campoDir) {
        campoDir.classList.toggle('campo-adicional--oculto', !esDelivery);
      }
      if (infoAlmacen) {
        infoAlmacen.classList.toggle('campo-adicional--oculto', esDelivery);
      }

      var carrito = carritoServicio.obtenerCarrito();
      var elementoTotal = document.getElementById('total-precio');
      actualizarTotalCarrito(elementoTotal, carrito);
    });
  });
}

function obtenerMetodoEntregaSeleccionado() {
  var nodo = document.querySelector('input[name="metodo-entrega"]:checked');
  return nodo ? nodo.value : 'recojo_almacen';
}

function configurarEventosPago() {
  var btnCerrar = document.getElementById('btn-cerrar-modal');
  if (btnCerrar) {
    btnCerrar.onclick = function () {
      document
        .getElementById('modal-pago')
        .classList.remove('modal-pago--visible');
    };
  }

  var formTarjeta = document.getElementById('form-tarjeta');
  if (formTarjeta) {
    formTarjeta.onsubmit = function (e) {
      e.preventDefault();
      formTarjeta.classList.add('form-tarjeta--oculto');
      var areaEstado = document.getElementById('estado-tarjeta');
      if (areaEstado) areaEstado.classList.add('modal-pago__estado--visible');

      setTimeout(function () {
        realizarPedidoFinal('pagado');
      }, 2500);
    };
  }
}

function mostrarCarrito() {
  var contenedor = document.getElementById('lista-carrito');
  var elementoTotal = document.getElementById('total-precio');
  var carrito = carritoServicio.obtenerCarrito();

  if (carrito.length === 0) {
    mostrarCarritoVacio(contenedor, elementoTotal);
    return;
  }

  if (!stockVerificadoEnSesion) {
    verificarStockCarrito(carrito).then(function (carritoActualizado) {
      stockVerificadoEnSesion = true;
      renderizarProductosCarrito(contenedor, carritoActualizado);
      actualizarTotalCarrito(elementoTotal, carritoActualizado);
      actualizadorContador.actualizar();
    });
  } else {
    renderizarProductosCarrito(contenedor, carrito);
    actualizarTotalCarrito(elementoTotal, carrito);
    actualizadorContador.actualizar();
  }
}

function mostrarCarritoVacio(contenedor, elementoTotal) {
  while (contenedor.firstChild) contenedor.removeChild(contenedor.firstChild);

  var divVacio = document.createElement('div');
  divVacio.className = 'carrito-vacio';

  var h3 = document.createElement('h3');
  h3.textContent = 'Tu carrito está vacío';
  divVacio.appendChild(h3);

  var p = document.createElement('p');
  p.textContent = 'Agrega productos para comenzar a comprar';
  divVacio.appendChild(p);

  var enlace = document.createElement('a');
  enlace.href = '/';
  enlace.className = 'btn-primary';
  enlace.textContent = 'Ir a la tienda';
  divVacio.appendChild(enlace);

  contenedor.appendChild(divVacio);
  if (elementoTotal) elementoTotal.textContent = 'Bs. 0.00';
  actualizadorContador.actualizar();
}

function verificarStockCarrito(carrito) {
  var carritoActualizado = [];
  var huboCambios = false;

  var promesas = carrito.map(function (item) {
    return productoServicio
      .verificarStock(item.id)
      .then(function (infoStock) {
        if (!infoStock.disponible || infoStock.stock === 0) {
          if (window.showToast) {
            window.showToast(
              'El producto "' +
                item.nombre +
                '" ya no está disponible y será eliminado del carrito.',
              { tipo: 'warning', duracion: 6000 },
            );
          }
          huboCambios = true;
          return null;
        }

        if (item.cantidad > infoStock.stock) {
          if (window.showToast) {
            window.showToast(
              'El producto "' +
                item.nombre +
                '" tiene menos stock. Se ajustó a ' +
                infoStock.stock +
                ' unidades.',
              { tipo: 'warning', duracion: 6000 },
            );
          }
          item.cantidad = infoStock.stock;
          huboCambios = true;
        }

        item.stock = infoStock.stock;
        return item;
      })
      .catch(function () {
        return item;
      });
  });

  return Promise.all(promesas).then(function (resultados) {
    carritoActualizado = resultados.filter(function (item) {
      return item !== null;
    });
    if (huboCambios) carritoServicio.guardarCarrito(carritoActualizado);
    return carritoActualizado;
  });
}

function renderizarProductosCarrito(contenedor, carrito) {
  while (contenedor.firstChild) contenedor.removeChild(contenedor.firstChild);

  carrito.forEach(function (producto) {
    var subtotal = CalculadorPrecio.calcularSubtotal(
      producto.precio,
      producto.cantidad,
    );
    var stock = producto.stock || 999;

    var divItem = document.createElement('div');
    divItem.className = 'item-carrito';

    var img = document.createElement('img');
    img.src = producto.imagen || '';
    img.alt = producto.nombre || '';
    divItem.appendChild(img);

    var divInfo = document.createElement('div');
    divInfo.className = 'item-carrito__info';

    var divNombre = document.createElement('div');
    divNombre.className = 'item-carrito__nombre';
    divNombre.textContent = producto.nombre || '';
    divInfo.appendChild(divNombre);

    var divPrecio = document.createElement('div');
    divPrecio.className = 'item-carrito__precio';
    divPrecio.textContent =
      'Bs. ' + CalculadorPrecio.formatearPrecio(producto.precio);
    divInfo.appendChild(divPrecio);

    var divStock = document.createElement('div');
    divStock.className = 'item-carrito__stock';
    divStock.textContent = 'Stock disponible: ' + stock + ' unidades';
    divInfo.appendChild(divStock);

    var divSubtotal = document.createElement('div');
    divSubtotal.className = 'item-carrito__subtotal';
    divSubtotal.textContent = 'Subtotal: Bs. ' + subtotal;
    divInfo.appendChild(divSubtotal);

    divItem.appendChild(divInfo);

    var divControles = document.createElement('div');
    divControles.className = 'item-carrito__controles';

    var divCantidad = document.createElement('div');
    divCantidad.className = 'cantidad-controles';

    var btnMenos = document.createElement('button');
    btnMenos.textContent = '-';
    btnMenos.addEventListener('click', function () {
      cambiarCantidad(producto.id, -1);
    });
    divCantidad.appendChild(btnMenos);

    var inputCantidad = document.createElement('input');
    inputCantidad.type = 'number';
    inputCantidad.value = producto.cantidad;
    inputCantidad.min = '1';
    inputCantidad.max = String(stock);
    inputCantidad.addEventListener('change', function () {
      actualizarCantidad(producto.id, inputCantidad.value);
    });
    divCantidad.appendChild(inputCantidad);

    var btnMas = document.createElement('button');
    btnMas.textContent = '+';
    btnMas.addEventListener('click', function () {
      cambiarCantidad(producto.id, 1);
    });
    divCantidad.appendChild(btnMas);

    divControles.appendChild(divCantidad);

    var btnEliminar = document.createElement('button');
    btnEliminar.className = 'btn-eliminar';
    btnEliminar.textContent = 'Eliminar';
    btnEliminar.addEventListener('click', function () {
      eliminarProducto(producto.id, producto.nombre);
    });
    divControles.appendChild(btnEliminar);

    divItem.appendChild(divControles);
    contenedor.appendChild(divItem);
  });
}

function actualizarTotalCarrito(elementoTotal, carrito) {
  var cantidadTotal = carrito.reduce(function (total, item) {
    return total + item.cantidad;
  }, 0);
  var precioProductos = carritoServicio.obtenerPrecioTotal();
  var metodo = obtenerMetodoEntregaSeleccionado();
  var costoEnvio = metodo === 'delivery' ? COSTO_DELIVERY : 0;
  var precioTotal = precioProductos + costoEnvio;

  var contenedorResumen = document.getElementById('resumen-detalle');
  if (contenedorResumen) {
    while (contenedorResumen.firstChild)
      contenedorResumen.removeChild(contenedorResumen.firstChild);

    var divResumenTotal = document.createElement('div');
    divResumenTotal.className = 'resumen-total';

    var divLineaProductos = document.createElement('div');
    divLineaProductos.className = 'resumen-linea';
    var spanProdLabel = document.createElement('span');
    spanProdLabel.textContent = 'Productos:';
    var spanProdVal = document.createElement('span');
    spanProdVal.textContent =
      cantidadTotal + ' unidad' + (cantidadTotal !== 1 ? 'es' : '');
    divLineaProductos.appendChild(spanProdLabel);
    divLineaProductos.appendChild(spanProdVal);
    divResumenTotal.appendChild(divLineaProductos);

    var divLineaEnvio = document.createElement('div');
    divLineaEnvio.className = 'resumen-linea';
    var spanEnvioLabel = document.createElement('span');
    spanEnvioLabel.textContent = 'Costo de envío:';
    var spanEnvioVal = document.createElement('span');
    if (costoEnvio > 0) {
      spanEnvioVal.textContent = 'Bs. ' + costoEnvio.toFixed(2);
    } else {
      spanEnvioVal.className = 'resumen-envio-gratis';
      spanEnvioVal.textContent = 'Gratis';
    }
    divLineaEnvio.appendChild(spanEnvioLabel);
    divLineaEnvio.appendChild(spanEnvioVal);
    divResumenTotal.appendChild(divLineaEnvio);

    var divLineaTotal = document.createElement('div');
    divLineaTotal.className = 'resumen-linea total';
    var spanTotalLabel = document.createElement('span');
    spanTotalLabel.textContent = 'Total:';
    var spanTotalVal = document.createElement('span');
    spanTotalVal.id = 'total-precio';
    spanTotalVal.textContent = 'Bs. ' + precioTotal.toFixed(2);
    divLineaTotal.appendChild(spanTotalLabel);
    divLineaTotal.appendChild(spanTotalVal);
    divResumenTotal.appendChild(divLineaTotal);

    contenedorResumen.appendChild(divResumenTotal);
  } else if (elementoTotal) {
    elementoTotal.textContent = 'Bs. ' + precioTotal.toFixed(2);
  }
}

function cambiarCantidad(idProducto, cambio) {
  var carrito = carritoServicio.obtenerCarrito();
  var item = carrito.find(function (p) {
    return p.id === idProducto;
  });
  if (!item) return;

  var cantidadNueva = item.cantidad + cambio;

  if (cantidadNueva < 1) {
    if (window.showConfirm) {
      window
        .showConfirm('¿Deseas eliminar este producto del carrito?', {
          textoConfirmar: 'Eliminar',
          textoCancelar: 'Cancelar',
        })
        .then(function (confirmado) {
          if (confirmado) eliminarProducto(idProducto, item.nombre);
        });
    }
    return;
  }

  var stockActual = item.stock || 999;
  if (cantidadNueva > stockActual) {
    if (window.showToast) {
      window.showToast('Solo hay ' + stockActual + ' unidades disponibles.', {
        tipo: 'warning',
      });
    }
    return;
  }

  carritoServicio.actualizarCantidad(idProducto, cantidadNueva);
  mostrarCarrito();
}

function actualizarCantidad(idProducto, nuevaCantidadStr) {
  var nuevaCantidad = parseInt(nuevaCantidadStr);
  if (isNaN(nuevaCantidad) || nuevaCantidad < 1) {
    if (window.showToast) {
      window.showToast('La cantidad debe ser al menos 1.', { tipo: 'warning' });
    }
    mostrarCarrito();
    return;
  }

  var carrito = carritoServicio.obtenerCarrito();
  var item = carrito.find(function (p) {
    return p.id === idProducto;
  });
  if (!item) return;

  var stockActual = item.stock || 999;
  if (nuevaCantidad > stockActual) {
    if (window.showToast) {
      window.showToast('Solo hay ' + stockActual + ' unidades disponibles.', {
        tipo: 'warning',
      });
    }
    mostrarCarrito();
    return;
  }

  carritoServicio.actualizarCantidad(idProducto, nuevaCantidad);
  mostrarCarrito();
}

function eliminarProducto(idProducto, nombreProducto) {
  if (window.showConfirm) {
    window
      .showConfirm(
        '¿Estás seguro de eliminar "' + nombreProducto + '" del carrito?',
        { textoConfirmar: 'Eliminar', textoCancelar: 'Cancelar' },
      )
      .then(function (confirmado) {
        if (confirmado) {
          carritoServicio.eliminarProducto(idProducto);
          mostrarCarrito();
        }
      });
  } else {
    carritoServicio.eliminarProducto(idProducto);
    mostrarCarrito();
  }
}

function configurarBotonFinalizar() {
  var btnFinalizar = document.getElementById('btn-finalizar');
  if (!btnFinalizar) return;

  btnFinalizar.addEventListener('click', function () {
    obtenerClienteSupabase().then(function (clienteSupabase) {
      if (!clienteSupabase) {
        window.location.href = '/login';
        return;
      }
      clienteSupabase.auth.getSession().then(function (resultado) {
        var sesion = resultado.data.session;
        if (!sesion) {
          window.location.href = '/login';
          return;
        }
        finalizarCompra();
      });
    });
  });
}

function finalizarCompra() {
  var carrito = carritoServicio.obtenerCarrito();
  if (!carrito || carrito.length === 0) {
    if (window.showToast) {
      window.showToast('El carrito está vacío.', { tipo: 'info' });
    }
    return;
  }

  var entregaNode = document.querySelector(
    'input[name="metodo-entrega"]:checked',
  );
  var pagoNode = document.querySelector('input[name="metodo-pago"]:checked');
  var direccionEl = document.getElementById('direccion');
  var direccion = direccionEl ? direccionEl.value : null;

  var entrega = entregaNode ? entregaNode.value : 'recojo_almacen';
  var pago = pagoNode ? pagoNode.value : 'efectivo';
  var costoEnvio = entrega === 'delivery' ? COSTO_DELIVERY : 0;
  var total = carritoServicio.obtenerPrecioTotal() + costoEnvio;

  if (entrega === 'delivery' && (!direccion || !direccion.trim())) {
    if (window.showToast) {
      window.showToast('Por favor ingresa la dirección de entrega.', {
        tipo: 'warning',
      });
    }
    return;
  }

  var pagoQR = document.getElementById('pago-qr');
  var pagoTarjetaEl = document.getElementById('pago-tarjeta');
  var estadoTarjeta = document.getElementById('estado-tarjeta');
  var formTarjeta = document.getElementById('form-tarjeta');
  var modal = document.getElementById('modal-pago');

  if (pago === 'efectivo') {
    realizarPedidoFinal('pendiente');
  } else if (pago === 'tarjeta') {
    pagoQR.classList.remove('modal-pago__panel--visible');
    pagoTarjetaEl.classList.add('modal-pago__panel--visible');
    formTarjeta.classList.remove('form-tarjeta--oculto');
    estadoTarjeta.classList.remove('modal-pago__estado--visible');
    document.getElementById('monto-tarjeta').textContent =
      'Bs. ' + total.toFixed(2);
    modal.classList.add('modal-pago--visible');
  } else if (pago === 'qr') {
    pagoTarjetaEl.classList.remove('modal-pago__panel--visible');
    pagoQR.classList.add('modal-pago__panel--visible');
    document.getElementById('monto-qr').textContent = 'Bs. ' + total.toFixed(2);
    document.getElementById('texto-estado-qr').textContent =
      'Esperando confirmación del banco...';
    var qrImg = document.getElementById('qr-img');
    if (qrImg) {
      var qrData = encodeURIComponent(
        'Raidencenter|Monto:' + total.toFixed(2) + '|Bs',
      );
      qrImg.src =
        'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' +
        qrData;
    }
    modal.classList.add('modal-pago--visible');

    setTimeout(function () {
      document.getElementById('texto-estado-qr').textContent =
        '¡Pago confirmado por el banco!';
      setTimeout(function () {
        realizarPedidoFinal('pagado');
      }, 1200);
    }, 4000);
  }
}

function realizarPedidoFinal(estadoPago) {
  obtenerClienteSupabase().then(function (clienteSupabase) {
    if (!clienteSupabase) return;

    clienteSupabase.auth.getSession().then(function (resultado) {
      var sesion = resultado.data.session;
      if (!sesion) return;

      var carrito = carritoServicio.obtenerCarrito();
      var precioProductos = carritoServicio.obtenerPrecioTotal();
      var entregaNode = document.querySelector(
        'input[name="metodo-entrega"]:checked',
      );
      var pagoNode = document.querySelector(
        'input[name="metodo-pago"]:checked',
      );
      var direccionEl = document.getElementById('direccion');
      var direccion = direccionEl ? direccionEl.value : null;

      var entrega = entregaNode ? entregaNode.value : 'recojo_almacen';
      var pago = pagoNode ? pagoNode.value : 'efectivo';
      var costoEnvio = entrega === 'delivery' ? COSTO_DELIVERY : 0;
      var total = precioProductos + costoEnvio;

      var detalles = carrito.map(function (item) {
        return {
          producto_id: item.id,
          cantidad: item.cantidad,
          precio_unitario_venta: item.precio,
        };
      });

      var payload = {
        usuario_id: sesion.user.id,
        monto_total: total,
        metodo_entrega: entrega,
        direccion_destino: direccion,
        detalles: detalles,
        pago: {
          metodo_pago: pago,
          estado_pago: estadoPago,
          es_en_cuotas: false,
          cantidad_cuotas: 1,
          monto_total_pagado: total,
        },
      };

      fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          return res.json().then(function (json) {
            if (!res.ok) throw new Error(json.error || res.statusText);
            return json;
          });
        })
        .then(function () {
          carritoServicio.vaciarCarrito();
          if (window.showToast) {
            window.showToast('¡Compra realizada con éxito!', {
              tipo: 'success',
            });
          }
          var modal = document.getElementById('modal-pago');
          if (modal) modal.classList.remove('modal-pago--visible');
          setTimeout(function () {
            window.location.href = '/historial';
          }, 1200);
        })
        .catch(function (err) {
          if (window.showToast) {
            window.showToast('Error al procesar el pedido: ' + err.message, {
              tipo: 'error',
            });
          }
        });
    });
  });
}
