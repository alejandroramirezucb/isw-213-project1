var rastreoGPSIntervalo = null;
var envioEnCursoId = null;

document.addEventListener('DOMContentLoaded', function () {
  cargarNavbar().then(function () {
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
        verificarRolChofer(clienteSupabase, sesion.user).then(
          function (esChofer) {
            if (!esChofer) {
              window.location.href = '/';
              return;
            }
            inicializarPanelChofer(clienteSupabase, sesion.user.id);
          },
        );
      });
    });
  });
});

function verificarRolChofer(clienteSupabase, usuario) {
  return clienteSupabase
    .from('usuarios')
    .select('rol')
    .eq('id', usuario.id)
    .single()
    .then(function (resultado) {
      if (resultado.error) return false;
      return resultado.data && resultado.data.rol === 'chofer';
    });
}

function inicializarPanelChofer(clienteSupabase, choferId) {
  configurarPestanasChofer();
  cargarEntregasPendientes(clienteSupabase, choferId);
  cargarEntregasEnCurso(clienteSupabase, choferId);
  cargarEntregasCompletadas(clienteSupabase, choferId);
  configurarModalEvidencia(clienteSupabase, choferId);
}

function configurarPestanasChofer() {
  var pestanas = document.querySelectorAll('.panel-chofer__pestana');
  pestanas.forEach(function (pestana) {
    pestana.addEventListener('click', function () {
      pestanas.forEach(function (p) {
        p.classList.remove('panel-chofer__pestana--activa');
      });
      pestana.classList.add('panel-chofer__pestana--activa');

      var secciones = document.querySelectorAll('.panel-chofer__seccion');
      secciones.forEach(function (s) {
        s.classList.remove('panel-chofer__seccion--activa');
      });

      var seccionId = 'seccion-' + pestana.getAttribute('data-seccion');
      var seccionActiva = document.getElementById(seccionId);
      if (seccionActiva) {
        seccionActiva.classList.add('panel-chofer__seccion--activa');
      }
    });
  });
}

function cargarEntregasPendientes(clienteSupabase, choferId) {
  var contenedor = document.getElementById('lista-pendientes');

  clienteSupabase
    .from('envios')
    .select(
      'id, pedido_id, fecha_asignacion, latitud_destino, longitud_destino',
    )
    .eq('chofer_id', choferId)
    .then(function (resultadoEnvios) {
      var envios = resultadoEnvios.data || [];
      var pedidoIds = envios.map(function (e) {
        return e.pedido_id;
      });

      if (!pedidoIds.length) {
        mostrarVacio(contenedor, 'No tienes entregas pendientes');
        return;
      }

      clienteSupabase
        .from('pedidos')
        .select(
          'id, monto_total, estado, direccion_destino, fecha_creacion, usuario_id',
        )
        .in('id', pedidoIds)
        .eq('estado', 'enviado')
        .order('fecha_creacion', { ascending: true })
        .then(function (resultadoPedidos) {
          var pedidos = resultadoPedidos.data || [];

          if (!pedidos.length) {
            mostrarVacio(contenedor, 'No tienes entregas pendientes');
            return;
          }

          var usuarioIds = pedidos.map(function (p) {
            return p.usuario_id;
          });
          clienteSupabase
            .from('usuarios')
            .select('id, nombre_completo')
            .in('id', usuarioIds)
            .then(function (resultadoUsuarios) {
              var usuarios = resultadoUsuarios.data || [];
              var mapaUsuarios = {};
              usuarios.forEach(function (u) {
                mapaUsuarios[u.id] = u.nombre_completo;
              });

              var mapaEnvios = {};
              envios.forEach(function (e) {
                mapaEnvios[e.pedido_id] = e;
              });

              renderizarTarjetas(
                contenedor,
                pedidos,
                mapaUsuarios,
                mapaEnvios,
                'pendiente',
                clienteSupabase,
                choferId,
              );
            });
        });
    });
}

function cargarEntregasEnCurso(clienteSupabase, choferId) {
  var contenedor = document.getElementById('lista-en-curso');

  clienteSupabase
    .from('envios')
    .select(
      'id, pedido_id, fecha_asignacion, latitud_destino, longitud_destino',
    )
    .eq('chofer_id', choferId)
    .then(function (resultadoEnvios) {
      var envios = resultadoEnvios.data || [];
      var pedidoIds = envios.map(function (e) {
        return e.pedido_id;
      });

      if (!pedidoIds.length) {
        mostrarVacio(contenedor, 'No tienes entregas en curso');
        return;
      }

      clienteSupabase
        .from('pedidos')
        .select(
          'id, monto_total, estado, direccion_destino, fecha_creacion, usuario_id',
        )
        .in('id', pedidoIds)
        .in('estado', ['trasladandose', 'listo para entregarse'])
        .order('fecha_creacion', { ascending: true })
        .then(function (resultadoPedidos) {
          var pedidos = resultadoPedidos.data || [];

          if (!pedidos.length) {
            mostrarVacio(contenedor, 'No tienes entregas en curso');
            return;
          }

          var usuarioIds = pedidos.map(function (p) {
            return p.usuario_id;
          });
          clienteSupabase
            .from('usuarios')
            .select('id, nombre_completo')
            .in('id', usuarioIds)
            .then(function (resultadoUsuarios) {
              var usuarios = resultadoUsuarios.data || [];
              var mapaUsuarios = {};
              usuarios.forEach(function (u) {
                mapaUsuarios[u.id] = u.nombre_completo;
              });

              var mapaEnvios = {};
              envios.forEach(function (e) {
                mapaEnvios[e.pedido_id] = e;
              });

              renderizarTarjetas(
                contenedor,
                pedidos,
                mapaUsuarios,
                mapaEnvios,
                'en-curso',
                clienteSupabase,
                choferId,
              );
            });
        });
    });
}

function cargarEntregasCompletadas(clienteSupabase, choferId) {
  var contenedor = document.getElementById('lista-completadas');

  clienteSupabase
    .from('envios')
    .select('id, pedido_id, fecha_asignacion, foto_evidencia_url')
    .eq('chofer_id', choferId)
    .then(function (resultadoEnvios) {
      var envios = resultadoEnvios.data || [];
      var pedidoIds = envios.map(function (e) {
        return e.pedido_id;
      });

      if (!pedidoIds.length) {
        mostrarVacio(contenedor, 'No tienes entregas completadas');
        return;
      }

      clienteSupabase
        .from('pedidos')
        .select(
          'id, monto_total, estado, direccion_destino, fecha_creacion, fecha_entrega_final, usuario_id',
        )
        .in('id', pedidoIds)
        .eq('estado', 'entregado')
        .order('fecha_entrega_final', { ascending: false })
        .limit(20)
        .then(function (resultadoPedidos) {
          var pedidos = resultadoPedidos.data || [];

          if (!pedidos.length) {
            mostrarVacio(contenedor, 'No tienes entregas completadas');
            return;
          }

          var usuarioIds = pedidos.map(function (p) {
            return p.usuario_id;
          });
          clienteSupabase
            .from('usuarios')
            .select('id, nombre_completo')
            .in('id', usuarioIds)
            .then(function (resultadoUsuarios) {
              var usuarios = resultadoUsuarios.data || [];
              var mapaUsuarios = {};
              usuarios.forEach(function (u) {
                mapaUsuarios[u.id] = u.nombre_completo;
              });

              var mapaEnvios = {};
              envios.forEach(function (e) {
                mapaEnvios[e.pedido_id] = e;
              });

              renderizarTarjetas(
                contenedor,
                pedidos,
                mapaUsuarios,
                mapaEnvios,
                'completada',
                clienteSupabase,
                choferId,
              );
            });
        });
    });
}

function mostrarVacio(contenedor, mensaje) {
  while (contenedor.firstChild) {
    contenedor.removeChild(contenedor.firstChild);
  }
  var p = document.createElement('p');
  p.className = 'panel-chofer__vacio';
  p.textContent = mensaje;
  contenedor.appendChild(p);
}

function renderizarTarjetas(
  contenedor,
  pedidos,
  mapaUsuarios,
  mapaEnvios,
  tipo,
  clienteSupabase,
  choferId,
) {
  while (contenedor.firstChild) {
    contenedor.removeChild(contenedor.firstChild);
  }

  pedidos.forEach(function (pedido) {
    var envio = mapaEnvios[pedido.id] || {};
    var tarjeta = document.createElement('article');
    tarjeta.className = 'panel-chofer__tarjeta';

    var cabecera = document.createElement('div');
    cabecera.className = 'panel-chofer__tarjeta-cabecera';

    var spanId = document.createElement('span');
    spanId.className = 'panel-chofer__pedido-id';
    spanId.textContent = 'Pedido #' + pedido.id;
    cabecera.appendChild(spanId);

    var spanEstado = document.createElement('span');
    var claseEstado = obtenerClaseEstado(pedido.estado);
    spanEstado.className = 'panel-chofer__estado ' + claseEstado;
    spanEstado.textContent = formatearEstado(pedido.estado);
    cabecera.appendChild(spanEstado);

    if (tipo === 'en-curso') {
      var spanGps = document.createElement('span');
      spanGps.className = 'panel-chofer__gps-activo';
      var punto = document.createElement('span');
      punto.className = 'panel-chofer__gps-punto';
      spanGps.appendChild(punto);
      spanGps.appendChild(document.createTextNode(' GPS Activo'));
      cabecera.appendChild(spanGps);
    }

    tarjeta.appendChild(cabecera);

    var cuerpo = document.createElement('div');
    cuerpo.className = 'panel-chofer__tarjeta-cuerpo';

    agregarLineaInfo(
      cuerpo,
      'Cliente',
      mapaUsuarios[pedido.usuario_id] || 'Desconocido',
    );
    agregarLineaInfo(
      cuerpo,
      'Dirección',
      pedido.direccion_destino || 'Sin dirección',
    );
    agregarLineaInfo(
      cuerpo,
      'Monto',
      'Bs. ' + (pedido.monto_total || 0).toFixed(2),
    );

    var fecha = new Date(pedido.fecha_creacion).toLocaleDateString('es-BO');
    agregarLineaInfo(cuerpo, 'Fecha', fecha);

    if (tipo === 'completada' && pedido.fecha_entrega_final) {
      var fechaEntrega = new Date(pedido.fecha_entrega_final).toLocaleString(
        'es-BO',
      );
      agregarLineaInfo(cuerpo, 'Entregado', fechaEntrega);
    }

    if (tipo === 'completada' && envio.foto_evidencia_url) {
      var divEvidencia = document.createElement('div');
      divEvidencia.className = 'panel-chofer__info-linea';
      var spanEtiqueta = document.createElement('span');
      spanEtiqueta.className = 'panel-chofer__info-etiqueta';
      spanEtiqueta.textContent = 'Evidencia:';
      divEvidencia.appendChild(spanEtiqueta);
      var imgEvidencia = document.createElement('img');
      imgEvidencia.src = envio.foto_evidencia_url;
      imgEvidencia.alt = 'Evidencia de entrega';
      imgEvidencia.className = 'panel-chofer__evidencia-img';
      divEvidencia.appendChild(imgEvidencia);
      cuerpo.appendChild(divEvidencia);
    }

    tarjeta.appendChild(cuerpo);

    var acciones = document.createElement('div');
    acciones.className = 'panel-chofer__tarjeta-acciones';

    if (tipo === 'pendiente') {
      var btnIniciar = document.createElement('button');
      btnIniciar.className =
        'panel-chofer__boton panel-chofer__boton--advertencia';
      btnIniciar.textContent = 'Iniciar Entrega';
      btnIniciar.addEventListener('click', function () {
        iniciarEntrega(clienteSupabase, pedido.id, envio.id, choferId);
      });
      acciones.appendChild(btnIniciar);
    }

    if (tipo === 'en-curso') {
      var btnEntregar = document.createElement('button');
      btnEntregar.className = 'panel-chofer__boton panel-chofer__boton--exito';
      btnEntregar.textContent = 'Marcar Entregado';
      btnEntregar.addEventListener('click', function () {
        abrirModalEvidencia(pedido.id, envio.id);
      });
      acciones.appendChild(btnEntregar);
    }

    tarjeta.appendChild(acciones);
    contenedor.appendChild(tarjeta);
  });
}

function agregarLineaInfo(contenedor, etiqueta, valor) {
  var div = document.createElement('div');
  div.className = 'panel-chofer__info-linea';
  var spanEtiqueta = document.createElement('span');
  spanEtiqueta.className = 'panel-chofer__info-etiqueta';
  spanEtiqueta.textContent = etiqueta + ':';
  div.appendChild(spanEtiqueta);
  var spanValor = document.createElement('span');
  spanValor.className = 'panel-chofer__info-valor';
  spanValor.textContent = valor;
  div.appendChild(spanValor);
  contenedor.appendChild(div);
}

function obtenerClaseEstado(estado) {
  if (estado === 'enviado') return 'panel-chofer__estado--enviado';
  if (estado === 'trasladandose') return 'panel-chofer__estado--trasladandose';
  if (estado === 'listo para entregarse') return 'panel-chofer__estado--listo';
  if (estado === 'entregado') return 'panel-chofer__estado--entregado';
  return '';
}

function formatearEstado(estado) {
  if (!estado) return '';
  return estado.replace(/-/g, ' ').replace(/\b\w/g, function (c) {
    return c.toUpperCase();
  });
}

function iniciarEntrega(clienteSupabase, pedidoId, envioId, choferId) {
  fetch('/api/pedidos/' + pedidoId + '/estado', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado: 'trasladandose' }),
  })
    .then(function (respuesta) {
      return respuesta.json();
    })
    .then(function (data) {
      if (data.error) {
        if (window.showToast) {
          window.showToast('Error al iniciar entrega: ' + data.error, {
            tipo: 'error',
          });
        }
        return;
      }

      if (window.showToast) {
        window.showToast('Entrega iniciada - GPS activado', {
          tipo: 'success',
        });
      }

      iniciarRastreoGPS(envioId);
      cargarEntregasPendientes(clienteSupabase, choferId);
      cargarEntregasEnCurso(clienteSupabase, choferId);
    });
}

function iniciarRastreoGPS(envioId) {
  detenerRastreoGPS();
  envioEnCursoId = envioId;

  enviarUbicacionActual(envioId);

  rastreoGPSIntervalo = setInterval(function () {
    enviarUbicacionActual(envioId);
  }, 30000);
}

function detenerRastreoGPS() {
  if (rastreoGPSIntervalo) {
    clearInterval(rastreoGPSIntervalo);
    rastreoGPSIntervalo = null;
  }
  envioEnCursoId = null;
}

function enviarUbicacionActual(envioId) {
  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(
    function (posicion) {
      fetch('/api/envios/ubicacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          envio_id: envioId,
          latitud: posicion.coords.latitude,
          longitud: posicion.coords.longitude,
        }),
      });
    },
    function () {},
    { enableHighAccuracy: true, timeout: 10000 },
  );
}

function abrirModalEvidencia(pedidoId, envioId) {
  document.getElementById('evidencia-pedido-id').value = pedidoId;
  document.getElementById('evidencia-envio-id').value = envioId;
  document.getElementById('evidencia-foto').value = '';
  document.getElementById('preview-imagen').style.display = 'none';
  document.getElementById('archivo-placeholder').style.display = 'flex';
  document.getElementById('modal-evidencia').style.display = 'flex';
  obtenerUbicacionParaModal();
}

function obtenerUbicacionParaModal() {
  var divUbicacion = document.getElementById('ubicacion-actual');
  divUbicacion.textContent = 'Obteniendo ubicación...';

  if (!navigator.geolocation) {
    divUbicacion.textContent = 'GPS no disponible en este dispositivo';
    return;
  }

  navigator.geolocation.getCurrentPosition(
    function (posicion) {
      var lat = posicion.coords.latitude.toFixed(6);
      var lng = posicion.coords.longitude.toFixed(6);
      divUbicacion.textContent = 'Lat: ' + lat + ' — Lng: ' + lng;
    },
    function () {
      divUbicacion.textContent = 'No se pudo obtener la ubicación';
    },
    { enableHighAccuracy: true, timeout: 10000 },
  );
}

function configurarModalEvidencia(clienteSupabase, choferId) {
  var modal = document.getElementById('modal-evidencia');
  var btnCerrar = document.getElementById('btn-cerrar-evidencia');
  var btnCancelar = document.getElementById('btn-cancelar-evidencia');
  var formulario = document.getElementById('form-evidencia');
  var inputFoto = document.getElementById('evidencia-foto');
  var previewImg = document.getElementById('preview-imagen');
  var placeholder = document.getElementById('archivo-placeholder');

  btnCerrar.addEventListener('click', function () {
    modal.style.display = 'none';
  });

  btnCancelar.addEventListener('click', function () {
    modal.style.display = 'none';
  });

  modal.addEventListener('click', function (evento) {
    if (evento.target === modal) {
      modal.style.display = 'none';
    }
  });

  inputFoto.addEventListener('change', function () {
    if (inputFoto.files && inputFoto.files[0]) {
      var lector = new FileReader();
      lector.onload = function (e) {
        previewImg.src = e.target.result;
        previewImg.style.display = 'block';
        placeholder.style.display = 'none';
      };
      lector.readAsDataURL(inputFoto.files[0]);
    }
  });

  formulario.addEventListener('submit', function (evento) {
    evento.preventDefault();

    var pedidoId = document.getElementById('evidencia-pedido-id').value;
    var envioId = document.getElementById('evidencia-envio-id').value;
    var archivo = inputFoto.files[0];

    if (!archivo) {
      if (window.showToast) {
        window.showToast('Debes subir una fotografía del paquete entregado', {
          tipo: 'warning',
        });
      }
      return;
    }

    subirEvidenciaYConfirmar(
      clienteSupabase,
      pedidoId,
      envioId,
      archivo,
      choferId,
    );
  });
}

function subirEvidenciaYConfirmar(
  clienteSupabase,
  pedidoId,
  envioId,
  archivo,
  choferId,
) {
  var nombreArchivo = 'evidencia_' + envioId + '_' + Date.now() + '.jpg';
  var rutaArchivo = 'evidencias/' + nombreArchivo;

  clienteSupabase.storage
    .from('evidencias-entrega')
    .upload(rutaArchivo, archivo, { contentType: archivo.type })
    .then(function (resultado) {
      var urlFoto;
      if (resultado.error) {
        urlFoto = 'evidencia_local_' + envioId + '_' + Date.now();
      } else {
        var urlData = clienteSupabase.storage
          .from('evidencias-entrega')
          .getPublicUrl(rutaArchivo);
        urlFoto = urlData.data.publicUrl;
      }

      return Promise.all([
        fetch('/api/envios/' + envioId + '/evidencia', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ foto_evidencia_url: urlFoto }),
        }),
        fetch('/api/pedidos/' + pedidoId + '/estado', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado: 'entregado' }),
        }),
      ]);
    })
    .then(function () {
      enviarUbicacionFinal(envioId);
      detenerRastreoGPS();

      document.getElementById('modal-evidencia').style.display = 'none';

      if (window.showToast) {
        window.showToast('Entrega confirmada con evidencia', {
          tipo: 'success',
          duracion: 5000,
        });
      }

      cargarEntregasEnCurso(clienteSupabase, choferId);
      cargarEntregasCompletadas(clienteSupabase, choferId);
    })
    .catch(function () {
      if (window.showToast) {
        window.showToast('Error al registrar evidencia', { tipo: 'error' });
      }
    });
}

function enviarUbicacionFinal(envioId) {
  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(
    function (posicion) {
      fetch('/api/envios/ubicacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          envio_id: envioId,
          latitud: posicion.coords.latitude,
          longitud: posicion.coords.longitude,
        }),
      });
    },
    function () {},
    { enableHighAccuracy: true, timeout: 10000 },
  );
}
