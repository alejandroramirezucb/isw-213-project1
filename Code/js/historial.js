var ESTADOS_DELIVERY = [
  'orden realizada',
  'en proceso',
  'enviado',
  'trasladandose',
  'listo para entregarse',
  'entregado',
];

var ESTADOS_RECOJO = [
  'orden realizada',
  'en proceso',
  'listo para entregarse',
  'entregado',
];

var clienteSupabaseHistorial = null;
var usuarioIdGlobal = null;

function obtenerEtiquetaEstado(estado) {
  if (!estado) return '';
  var etiquetas = {
    'orden realizada': 'Orden Realizada',
    recibido: 'Recibido',
    'en proceso': 'En Proceso',
    enviado: 'Enviado',
    trasladandose: 'Trasladándose',
    'listo para entregarse': 'Listo para Entregarse',
    entregado: 'Entregado',
    cerrado: 'Cerrado',
  };
  return (
    etiquetas[estado] ||
    estado.replace(/-/g, ' ').replace(/\b\w/g, function (c) {
      return c.toUpperCase();
    })
  );
}

document.addEventListener('DOMContentLoaded', function () {
  cargarNavbar().then(function () {
    configurarModalDevolucion();
    cargarMisPedidos();
  });
});

function cargarMisPedidos() {
  var contenedorPedidos = document.querySelector('.pedidos__lista');
  if (!contenedorPedidos) return;

  obtenerClienteSupabase().then(function (clienteSupabase) {
    if (!clienteSupabase) {
      window.location.href = '/login';
      return;
    }

    clienteSupabaseHistorial = clienteSupabase;

    clienteSupabase.auth.getSession().then(function (resultado) {
      var sesion = resultado.data.session;
      if (!sesion) {
        window.location.href = '/login';
        return;
      }

      usuarioIdGlobal = sesion.user.id;
      obtenerPedidosConHistorial(
        clienteSupabase,
        sesion.user.id,
        contenedorPedidos,
      );
      suscribirseACambiosPedidos(
        clienteSupabase,
        sesion.user.id,
        contenedorPedidos,
      );
    });
  });
}

function obtenerPedidosConHistorial(clienteSupabase, usuarioId, contenedor) {
  clienteSupabase
    .from('pedidos')
    .select(
      'id, monto_total, estado, fecha_creacion, direccion_destino, metodo_entrega, confirmacion_cliente, fecha_entrega_final',
    )
    .eq('usuario_id', usuarioId)
    .order('fecha_creacion', { ascending: false })
    .then(function (resultadoPedidos) {
      if (resultadoPedidos.error) {
        if (window.showToast) {
          window.showToast('Error al cargar pedidos', { tipo: 'error' });
        }
        return;
      }

      var pedidos = resultadoPedidos.data || [];

      if (pedidos.length === 0) {
        var mensaje = document.createElement('p');
        mensaje.className = 'pedidos__mensaje-vacio';
        mensaje.textContent = 'No tienes pedidos registrados';
        while (contenedor.firstChild)
          contenedor.removeChild(contenedor.firstChild);
        contenedor.appendChild(mensaje);
        return;
      }

      var pedidoIds = pedidos.map(function (p) {
        return p.id;
      });

      Promise.all([
        clienteSupabase
          .from('detalles_pedido')
          .select('id, pedido_id, cantidad, precio_unitario_venta, producto_id')
          .in('pedido_id', pedidoIds),
        clienteSupabase
          .from('historial_estados_pedido')
          .select('pedido_id, estado, fecha_cambio')
          .in('pedido_id', pedidoIds)
          .order('fecha_cambio', { ascending: true }),
        clienteSupabase
          .from('devoluciones')
          .select(
            'id, pedido_id, motivo_devolucion, estado_devolucion, fecha_solicitud',
          )
          .in('pedido_id', pedidoIds),
      ])
        .then(function (resultados) {
          var detalles = resultados[0].data || [];
          var historialEstados = resultados[1].data || [];
          var devoluciones = resultados[2].data || [];

          pedidos.forEach(function (pedido) {
            pedido.detalles = detalles.filter(function (d) {
              return d.pedido_id === pedido.id;
            });
            pedido.historial_estados = historialEstados.filter(function (h) {
              return h.pedido_id === pedido.id;
            });
            pedido.devolucion =
              devoluciones.filter(function (d) {
                return d.pedido_id === pedido.id;
              })[0] || null;
          });

          renderizarPedidosConTimeline(contenedor, pedidos);
        })
        .catch(function () {
          renderizarPedidosConTimeline(contenedor, pedidos);
        });
    });
}

function renderizarPedidosConTimeline(contenedor, pedidos) {
  while (contenedor.firstChild) contenedor.removeChild(contenedor.firstChild);
  pedidos.forEach(function (pedido) {
    contenedor.appendChild(crearTarjetaPedido(pedido));
  });
}

function crearTarjetaPedido(pedido) {
  var articulo = document.createElement('article');
  articulo.className = 'pedido-tarjeta';
  articulo.id = 'pedido-tarjeta-' + pedido.id;

  var cabecera = document.createElement('div');
  cabecera.className = 'pedido-tarjeta__cabecera';

  var infoDiv = document.createElement('div');
  infoDiv.className = 'pedido-tarjeta__info';

  var numeroPedido = document.createElement('span');
  numeroPedido.className = 'pedido-tarjeta__numero';
  numeroPedido.textContent = 'Pedido #' + pedido.id;
  infoDiv.appendChild(numeroPedido);

  var fechaPedido = document.createElement('span');
  fechaPedido.className = 'pedido-tarjeta__fecha';
  fechaPedido.textContent = new Date(pedido.fecha_creacion).toLocaleDateString(
    'es-BO',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
  );
  infoDiv.appendChild(fechaPedido);

  cabecera.appendChild(infoDiv);

  var divDerecho = document.createElement('div');
  divDerecho.className = 'pedido-tarjeta__cabecera-derecho';

  var estadoBadge = document.createElement('span');
  var claseEstadoMod = (pedido.estado || '').replace(/\s+/g, '-');
  estadoBadge.className =
    'pedido-tarjeta__estado-badge pedido-tarjeta__estado-badge--' +
    claseEstadoMod;
  estadoBadge.textContent =
    obtenerEtiquetaEstado(pedido.estado) || 'Orden Realizada';
  divDerecho.appendChild(estadoBadge);

  var flecha = document.createElement('span');
  flecha.className = 'pedido-tarjeta__flecha';
  flecha.textContent = '▼';
  divDerecho.appendChild(flecha);

  cabecera.appendChild(divDerecho);

  var cuerpo = document.createElement('div');
  cuerpo.className = 'pedido-tarjeta__cuerpo';

  cabecera.addEventListener('click', function () {
    var estaVisible = cuerpo.classList.contains(
      'pedido-tarjeta__cuerpo--visible',
    );
    cuerpo.classList.toggle('pedido-tarjeta__cuerpo--visible');
    flecha.classList.toggle('pedido-tarjeta__flecha--abierto', !estaVisible);
  });

  var detallesDiv = document.createElement('div');
  detallesDiv.className = 'pedido-tarjeta__detalles';

  var detalles = pedido.detalles || [];
  var cantidadProductos = detalles.reduce(function (suma, d) {
    return suma + d.cantidad;
  }, 0);

  var pCantidad = document.createElement('span');
  pCantidad.textContent = cantidadProductos + ' producto(s)';
  detallesDiv.appendChild(pCantidad);

  var pMetodo = document.createElement('span');
  pMetodo.textContent =
    pedido.metodo_entrega === 'delivery' ? 'Delivery' : 'Recojo en almacén';
  detallesDiv.appendChild(pMetodo);

  var pTotal = document.createElement('span');
  pTotal.className = 'pedido-tarjeta__total';
  pTotal.textContent = 'Bs. ' + parseFloat(pedido.monto_total || 0).toFixed(2);
  detallesDiv.appendChild(pTotal);

  cuerpo.appendChild(detallesDiv);

  var lineaTiempo = crearLineaTiempo(pedido);
  cuerpo.appendChild(lineaTiempo);

  if (pedido.estado === 'entregado' && !pedido.confirmacion_cliente) {
    var acciones = document.createElement('div');
    acciones.className = 'pedido-tarjeta__acciones';

    var btnConfirmar = document.createElement('button');
    btnConfirmar.className =
      'pedido-tarjeta__boton pedido-tarjeta__boton--confirmar';
    btnConfirmar.textContent = 'Confirmar Recepcion';
    btnConfirmar.addEventListener('click', function () {
      confirmarRecepcionPedido(pedido.id);
    });
    acciones.appendChild(btnConfirmar);

    cuerpo.appendChild(acciones);
  }

  if (pedido.estado === 'cerrado' || pedido.confirmacion_cliente) {
    var textoConfirmado = document.createElement('div');
    textoConfirmado.className = 'pedido-tarjeta__acciones';
    var spanTexto = document.createElement('span');
    spanTexto.className = 'pedido-tarjeta__confirmacion-texto';
    spanTexto.textContent = '✓ Pedido finalizado y confirmado';
    textoConfirmado.appendChild(spanTexto);
    cuerpo.appendChild(textoConfirmado);
  }

  var seccionQR = crearSeccionQRRecojo(pedido);
  if (seccionQR) {
    cuerpo.appendChild(seccionQR);
  }

  var seccionDevolucion = crearSeccionDevolucion(pedido);
  if (seccionDevolucion) {
    cuerpo.appendChild(seccionDevolucion);
  }

  articulo.appendChild(cabecera);
  articulo.appendChild(cuerpo);

  return articulo;
}

function crearSeccionQRRecojo(pedido) {
  if (pedido.metodo_entrega !== 'recojo_almacen') return null;

  var estadosMostrarQR = [
    'orden realizada',
    'en proceso',
    'listo para entregarse',
  ];
  if (estadosMostrarQR.indexOf(pedido.estado) === -1) return null;

  var seccion = document.createElement('div');
  seccion.className = 'pedido-tarjeta__seccion-qr';

  var titulo = document.createElement('p');
  titulo.className = 'pedido-tarjeta__qr-titulo';
  titulo.textContent =
    pedido.estado === 'listo para entregarse'
      ? '¡Tu pedido está listo! Muestra este código QR al retirar en almacén'
      : 'Código QR para retiro en almacén (Av. San Martín 450, Santa Cruz)';
  seccion.appendChild(titulo);

  var contenedorQR = document.createElement('div');
  contenedorQR.className = 'pedido-tarjeta__qr-contenedor';

  var imagenQR = document.createElement('img');
  imagenQR.className = 'pedido-tarjeta__qr-imagen';
  imagenQR.alt = 'QR de retiro pedido #' + pedido.id;
  imagenQR.src =
    'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' +
    encodeURIComponent(pedido.id);
  contenedorQR.appendChild(imagenQR);

  var idTexto = document.createElement('span');
  idTexto.className = 'pedido-tarjeta__qr-id';
  idTexto.textContent = 'ID: ' + pedido.id.toString().slice(0, 8).toUpperCase();
  contenedorQR.appendChild(idTexto);

  seccion.appendChild(contenedorQR);

  return seccion;
}

function crearLineaTiempo(pedido) {
  var ul = document.createElement('ul');
  ul.className = 'linea-tiempo';

  var historial = pedido.historial_estados || [];
  var mapaFechas = {};
  historial.forEach(function (h) {
    mapaFechas[h.estado] = h.fecha_cambio;
  });

  var estadosPedido =
    pedido.metodo_entrega === 'delivery' ? ESTADOS_DELIVERY : ESTADOS_RECOJO;

  var estadoNormalizado =
    pedido.estado === 'recibido' ? 'orden realizada' : pedido.estado;
  var estadoActualIndex = estadosPedido.indexOf(estadoNormalizado);
  if (estadoActualIndex === -1 && pedido.estado === 'cerrado') {
    estadoActualIndex = estadosPedido.length;
  }

  var nombresEstados = {
    'orden realizada': 'Orden Realizada',
    recibido: 'Recibido',
    'en proceso': 'En Proceso',
    enviado: 'Enviado',
    trasladandose: 'Trasladándose',
    'listo para entregarse': 'Listo para Entregarse',
    entregado: 'Entregado',
  };

  estadosPedido.forEach(function (estado, indice) {
    var li = document.createElement('li');
    var claseModificador = '';

    if (indice < estadoActualIndex) {
      claseModificador = 'linea-tiempo__paso--completado';
    } else if (indice === estadoActualIndex) {
      claseModificador = 'linea-tiempo__paso--actual';
    } else {
      claseModificador = 'linea-tiempo__paso--pendiente';
    }

    li.className = 'linea-tiempo__paso ' + claseModificador;

    var punto = document.createElement('div');
    punto.className = 'linea-tiempo__punto';
    li.appendChild(punto);

    var nombreEstado = document.createElement('span');
    nombreEstado.className = 'linea-tiempo__nombre-estado';
    nombreEstado.textContent = nombresEstados[estado] || estado;
    li.appendChild(nombreEstado);

    if (mapaFechas[estado]) {
      var fechaEstado = document.createElement('span');
      fechaEstado.className = 'linea-tiempo__fecha-estado';
      fechaEstado.textContent = new Date(mapaFechas[estado]).toLocaleString(
        'es-BO',
        {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        },
      );
      li.appendChild(fechaEstado);
    }

    ul.appendChild(li);
  });

  if (pedido.estado === 'cerrado') {
    var liCerrado = document.createElement('li');
    liCerrado.className = 'linea-tiempo__paso linea-tiempo__paso--completado';

    var puntoCerrado = document.createElement('div');
    puntoCerrado.className = 'linea-tiempo__punto';
    liCerrado.appendChild(puntoCerrado);

    var nombreCerrado = document.createElement('span');
    nombreCerrado.className = 'linea-tiempo__nombre-estado';
    nombreCerrado.textContent = 'Cerrado';
    liCerrado.appendChild(nombreCerrado);

    if (mapaFechas['cerrado']) {
      var fechaCerrado = document.createElement('span');
      fechaCerrado.className = 'linea-tiempo__fecha-estado';
      fechaCerrado.textContent = new Date(mapaFechas['cerrado']).toLocaleString(
        'es-BO',
        {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        },
      );
      liCerrado.appendChild(fechaCerrado);
    }

    ul.appendChild(liCerrado);
  }

  return ul;
}

function confirmarRecepcionPedido(pedidoId) {
  fetch('/api/pedidos/' + pedidoId + '/confirmar-recepcion', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
  })
    .then(function (respuesta) {
      return respuesta.json();
    })
    .then(function (data) {
      if (data.error) {
        if (window.showToast) {
          window.showToast('Error al confirmar: ' + data.error, {
            tipo: 'error',
          });
        }
        return;
      }

      if (window.showToast) {
        window.showToast('Pedido confirmado y cerrado exitosamente', {
          tipo: 'success',
          duracion: 5000,
        });
      }

      var contenedor = document.querySelector('.pedidos__lista');
      obtenerPedidosConHistorial(
        clienteSupabaseHistorial,
        usuarioIdGlobal,
        contenedor,
      );
    });
}

function suscribirseACambiosPedidos(clienteSupabase, usuarioId, contenedor) {
  clienteSupabase
    .channel('mis-pedidos-' + usuarioId)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'pedidos',
        filter: 'usuario_id=eq.' + usuarioId,
      },
      function (payload) {
        var pedidoActualizado = payload.new;

        if (pedidoActualizado.estado === 'listo para entregarse') {
          if (window.showToast) {
            window.showToast(
              '¡Tu pedido #' +
                pedidoActualizado.id +
                ' está listo para entregarse! El chofer está cerca.',
              { tipo: 'success', duracion: 8000 },
            );
          }
        }

        obtenerPedidosConHistorial(clienteSupabase, usuarioId, contenedor);
      },
    )
    .subscribe();
}

function crearSeccionDevolucion(pedido) {
  var estadosConDevolucion = ['entregado', 'cerrado'];
  var pedidoEntregado =
    estadosConDevolucion.indexOf(pedido.estado) !== -1 ||
    pedido.confirmacion_cliente;

  if (!pedidoEntregado) {
    return null;
  }

  var divDevolucion = document.createElement('div');
  divDevolucion.className = 'pedido-tarjeta__acciones';

  if (pedido.devolucion) {
    var estadoDevolucion = pedido.devolucion.estado_devolucion;
    var spanEstado = document.createElement('span');
    var claseModificador =
      'pedido-tarjeta__devolucion-estado--' + estadoDevolucion;
    spanEstado.className =
      'pedido-tarjeta__devolucion-estado ' + claseModificador;

    if (estadoDevolucion === 'pendiente') {
      spanEstado.textContent = 'Devolucion solicitada - En revision';
    } else if (estadoDevolucion === 'aprobada') {
      spanEstado.textContent = '✓ Devolucion aprobada - Reembolso procesado';
    } else if (estadoDevolucion === 'rechazada') {
      spanEstado.textContent = '✗ Devolucion rechazada';
    }

    divDevolucion.appendChild(spanEstado);
    return divDevolucion;
  }

  var fechaEntrega = pedido.fecha_entrega_final;
  if (!fechaEntrega) {
    return null;
  }

  var milisegundosEn24Horas = 24 * 60 * 60 * 1000;
  var fechaEntregaDate = new Date(fechaEntrega);
  var ahora = new Date();
  var diferenciaTiempo = ahora.getTime() - fechaEntregaDate.getTime();
  var dentroDelPlazo = diferenciaTiempo <= milisegundosEn24Horas;

  if (dentroDelPlazo) {
    var btnDevolucion = document.createElement('button');
    btnDevolucion.className =
      'pedido-tarjeta__boton pedido-tarjeta__boton--devolucion';
    btnDevolucion.textContent = 'Solicitar Devolucion';
    btnDevolucion.addEventListener('click', function () {
      abrirModalDevolucion(pedido.id);
    });
    divDevolucion.appendChild(btnDevolucion);
  } else {
    var spanVencido = document.createElement('span');
    spanVencido.className = 'pedido-tarjeta__devolucion-vencido';
    spanVencido.textContent = 'Plazo de devolucion vencido (24 horas)';
    divDevolucion.appendChild(spanVencido);
  }

  return divDevolucion;
}

function abrirModalDevolucion(pedidoId) {
  var modal = document.getElementById('modal-devolucion');
  document.getElementById('devolucion-pedido-id').value = pedidoId;
  document.getElementById('devolucion-motivo').value = '';
  document.getElementById('devolucion-foto').value = '';
  document.getElementById('devolucion-preview').style.display = 'none';
  modal.classList.add('modal-devolucion--visible');
}

function cerrarModalDevolucion() {
  var modal = document.getElementById('modal-devolucion');
  modal.classList.remove('modal-devolucion--visible');
}

function configurarModalDevolucion() {
  var btnCerrar = document.getElementById('btn-cerrar-devolucion');
  var btnCancelar = document.getElementById('btn-cancelar-devolucion');
  var formulario = document.getElementById('formulario-devolucion');
  var inputFoto = document.getElementById('devolucion-foto');
  var previewImg = document.getElementById('devolucion-preview');
  var modal = document.getElementById('modal-devolucion');

  if (!btnCerrar || !formulario) return;

  btnCerrar.addEventListener('click', cerrarModalDevolucion);
  btnCancelar.addEventListener('click', cerrarModalDevolucion);

  modal.addEventListener('click', function (evento) {
    if (evento.target === modal) {
      cerrarModalDevolucion();
    }
  });

  inputFoto.addEventListener('change', function () {
    if (inputFoto.files && inputFoto.files[0]) {
      var lector = new FileReader();
      lector.onload = function (e) {
        previewImg.src = e.target.result;
        previewImg.style.display = 'block';
      };
      lector.readAsDataURL(inputFoto.files[0]);
    }
  });

  formulario.addEventListener('submit', function (evento) {
    evento.preventDefault();
    enviarSolicitudDevolucion();
  });
}

function enviarSolicitudDevolucion() {
  var pedidoId = document.getElementById('devolucion-pedido-id').value;
  var motivo = document.getElementById('devolucion-motivo').value.trim();
  var archivoFoto = document.getElementById('devolucion-foto').files[0];

  if (!motivo) {
    if (window.showToast) {
      window.showToast('Debes ingresar un motivo para la devolucion', {
        tipo: 'warning',
      });
    }
    return;
  }

  if (!archivoFoto) {
    if (window.showToast) {
      window.showToast('Debes adjuntar una foto de la factura', {
        tipo: 'warning',
      });
    }
    return;
  }

  var nombreArchivo = 'factura_' + pedidoId + '_' + Date.now() + '.jpg';
  var rutaArchivo = 'facturas/' + nombreArchivo;

  clienteSupabaseHistorial.storage
    .from('devoluciones')
    .upload(rutaArchivo, archivoFoto, { contentType: archivoFoto.type })
    .then(function (resultadoSubida) {
      var urlFoto;

      if (resultadoSubida.error) {
        urlFoto = 'factura_local_' + pedidoId + '_' + Date.now();
      } else {
        var urlData = clienteSupabaseHistorial.storage
          .from('devoluciones')
          .getPublicUrl(rutaArchivo);
        urlFoto = urlData.data.publicUrl;
      }

      return fetch('/api/devoluciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedido_id: parseInt(pedidoId, 10),
          motivo_devolucion: motivo,
          foto_factura_url: urlFoto,
        }),
      });
    })
    .then(function (respuesta) {
      return respuesta.json();
    })
    .then(function (data) {
      if (data.error) {
        if (window.showToast) {
          window.showToast('Error al enviar solicitud: ' + data.error, {
            tipo: 'error',
          });
        }
        return;
      }

      cerrarModalDevolucion();

      if (window.showToast) {
        window.showToast('Solicitud de devolucion enviada correctamente', {
          tipo: 'success',
          duracion: 5000,
        });
      }

      var contenedor = document.querySelector('.pedidos__lista');
      obtenerPedidosConHistorial(
        clienteSupabaseHistorial,
        usuarioIdGlobal,
        contenedor,
      );
    })
    .catch(function () {
      if (window.showToast) {
        window.showToast('Error al procesar la solicitud de devolucion', {
          tipo: 'error',
        });
      }
    });
}
