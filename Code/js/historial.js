document.addEventListener('DOMContentLoaded', function () {
  cargarNavbar().then(function () {
    cargarHistorialPedidos();
  });
});

function cargarHistorialPedidos() {
  var contenedorHistorial = document.querySelector('.historial__lista');
  if (!contenedorHistorial) return;

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

      clienteSupabase
        .from('pedidos')
        .select(
          'id, monto_total, estado, fecha_creacion, direccion_destino, metodo_entrega',
        )
        .eq('usuario_id', sesion.user.id)
        .order('fecha_creacion', { ascending: false })
        .then(function (resultadoPedidos) {
          if (resultadoPedidos.error) {
            if (window.showToast) {
              window.showToast('Error al cargar historial', { tipo: 'error' });
            }
            return;
          }

          var pedidos = resultadoPedidos.data || [];

          if (pedidos.length === 0) {
            var mensaje = document.createElement('p');
            mensaje.className = 'historial__mensaje-vacio';
            mensaje.textContent = 'No tienes pedidos registrados';
            contenedorHistorial.appendChild(mensaje);
            return;
          }

          var pedidoIds = pedidos.map(function (p) {
            return p.id;
          });

          clienteSupabase
            .from('detalles_pedido')
            .select(
              'id, pedido_id, cantidad, precio_unitario_venta, producto_id',
            )
            .in('pedido_id', pedidoIds)
            .then(function (resultadoDetalles) {
              var detalles = resultadoDetalles.data || [];

              pedidos.forEach(function (pedido) {
                pedido.detalles = detalles.filter(function (d) {
                  return d.pedido_id === pedido.id;
                });
              });

              renderizarPedidos(contenedorHistorial, pedidos);
            });
        });
    });
  });
}

function renderizarPedidos(contenedor, pedidos) {
  while (contenedor.firstChild) contenedor.removeChild(contenedor.firstChild);
  pedidos.forEach(function (pedido) {
    contenedor.appendChild(crearElementoPedido(pedido));
  });
}

function crearElementoPedido(pedido) {
  var articulo = document.createElement('article');
  articulo.className = 'historial__pedido';

  var fecha = new Date(pedido.fecha_creacion).toLocaleDateString('es-BO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  var cabecera = document.createElement('header');
  cabecera.className = 'historial__pedido-cabecera';

  var infoDiv = document.createElement('div');

  var h3 = document.createElement('h3');
  h3.className = 'historial__pedido-numero';
  h3.textContent = 'Pedido #' + pedido.id;

  var time = document.createElement('time');
  time.className = 'historial__pedido-fecha';
  time.textContent = fecha;

  infoDiv.appendChild(h3);
  infoDiv.appendChild(time);

  var estadoTexto = pedido.estado || 'pendiente';
  var claseEstadoMod = estadoTexto.replace(/\s+/g, '-');
  var estadoSpan = document.createElement('span');
  estadoSpan.className =
    'historial__estado historial__estado--' + claseEstadoMod;
  estadoSpan.textContent = estadoTexto;

  cabecera.appendChild(infoDiv);
  cabecera.appendChild(estadoSpan);

  var detallesDiv = document.createElement('div');
  detallesDiv.className = 'historial__pedido-detalles';

  var detalles = pedido.detalles || [];
  var cantidadProductos = detalles.reduce(function (suma, d) {
    return suma + d.cantidad;
  }, 0);

  var pCantidad = document.createElement('p');
  pCantidad.textContent = cantidadProductos + ' producto(s)';

  var pMetodo = document.createElement('p');
  pMetodo.textContent =
    'Método: ' +
    (pedido.metodo_entrega === 'delivery' ? 'Delivery' : 'Recojo en almacén');

  var pTotal = document.createElement('p');
  pTotal.className = 'historial__pedido-total';
  pTotal.textContent =
    'Total: Bs. ' + parseFloat(pedido.monto_total || 0).toFixed(2);

  detallesDiv.appendChild(pCantidad);
  detallesDiv.appendChild(pMetodo);
  detallesDiv.appendChild(pTotal);

  articulo.appendChild(cabecera);
  articulo.appendChild(detallesDiv);

  return articulo;
}
