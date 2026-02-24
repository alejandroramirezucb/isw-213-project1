document.addEventListener('DOMContentLoaded', function () {
  cargarNavbar().then(function () {
    prefrellenarFormulario();
    configurarFAQ();
    configurarFormularioContacto();
    cargarMisConsultas();
  });
});

function cargarMisConsultas() {
  obtenerClienteSupabase().then(function (clienteSupabase) {
    if (!clienteSupabase) return;
    clienteSupabase.auth.getSession().then(function (resultado) {
      var sesion = resultado.data.session;
      if (!sesion) {
        var seccion = document.getElementById('seccion-mis-consultas');
        if (seccion) seccion.style.display = 'none';
        return;
      }

      var seccion = document.getElementById('seccion-mis-consultas');
      if (seccion) seccion.style.display = 'block';

      var usuarioId = sesion.user.id;

      clienteSupabase
        .from('mensajes_ayuda')
        .select(
          'id, categoria, mensaje, respuesta_admin, estado, fecha_creacion, fecha_respuesta',
        )
        .eq('usuario_id', usuarioId)
        .order('fecha_creacion', { ascending: false })
        .then(function (res) {
          var contenedor = document.getElementById('lista-mis-consultas');
          if (!contenedor) return;
          if (res.error) {
            console.error('Error RLS:', res.error.message);
            contenedor.innerHTML =
              '<p class="consultas__vacio">Error: ' +
              (res.error.message || 'No tienes permiso') +
              '</p>';
            return;
          }
          var consultas = res.data || [];

          if (consultas.length === 0) {
            contenedor.innerHTML =
              '<p class="consultas__vacio">Aún no has enviado ninguna consulta.</p>';
            return;
          }

          var html = '<div class="consultas__lista">';
          consultas.forEach(function (c) {
            var fecha = new Date(c.fecha_creacion).toLocaleDateString('es-BO', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            });
            var estadoClase =
              c.estado === 'respondido'
                ? 'consulta__estado--respondido'
                : 'consulta__estado--pendiente';
            var estadoTexto =
              c.estado === 'respondido' ? 'Respondido' : 'Pendiente';
            var respuestaHtml = '';
            if (c.respuesta_admin) {
              var fechaResp = c.fecha_respuesta
                ? new Date(c.fecha_respuesta).toLocaleDateString('es-BO', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : '';
              respuestaHtml =
                '<div class="consulta__respuesta"><p class="consulta__respuesta-titulo">Respuesta del equipo' +
                (fechaResp ? ' &ndash; ' + fechaResp : '') +
                '</p><p>' +
                c.respuesta_admin +
                '</p></div>';
            }
            html +=
              '<div class="consulta__tarjeta">' +
              '<div class="consulta__encabezado">' +
              '<span class="consulta__categoria">' +
              (c.categoria || '') +
              '</span>' +
              '<span class="consulta__fecha">' +
              fecha +
              '</span>' +
              '</div>' +
              '<span class="' +
              estadoClase +
              '">' +
              estadoTexto +
              '</span>' +
              '<p class="consulta__mensaje">' +
              c.mensaje +
              '</p>' +
              respuestaHtml +
              '</div>';
          });
          html += '</div>';
          contenedor.innerHTML = html;
        });
    });
  });
}

function prefrellenarFormulario() {
  obtenerClienteSupabase().then(function (clienteSupabase) {
    if (!clienteSupabase) return;
    clienteSupabase.auth.getSession().then(function (resultado) {
      var sesion = resultado.data.session;
      if (!sesion) return;
      var user = sesion.user;

      var campoEmail = document.getElementById('contacto-email');
      if (campoEmail && user.email) {
        campoEmail.value = user.email;
      }

      clienteSupabase
        .from('usuarios')
        .select('nombre_completo')
        .eq('id', user.id)
        .single()
        .then(function (res) {
          if (res.data && res.data.nombre_completo) {
            var campoNombre = document.getElementById('contacto-nombre');
            if (campoNombre) campoNombre.value = res.data.nombre_completo;
          }
        });
    });
  });
}

function configurarFAQ() {
  document.querySelectorAll('.faq__boton-pestana').forEach(function (boton) {
    boton.addEventListener('click', function () {
      document.querySelectorAll('.faq__boton-pestana').forEach(function (b) {
        b.classList.remove('faq__boton-pestana--activo');
      });
      document.querySelectorAll('.faq__panel').forEach(function (panel) {
        panel.classList.remove('faq__panel--activo');
      });
      boton.classList.add('faq__boton-pestana--activo');
      var panelId = 'faq-' + boton.dataset.panel;
      var panel = document.getElementById(panelId);
      if (panel) {
        panel.classList.add('faq__panel--activo');
      }
    });
  });

  document.querySelectorAll('.faq__pregunta').forEach(function (pregunta) {
    pregunta.addEventListener('click', function () {
      var item = pregunta.closest('.faq__item');
      var estaAbierto = item.classList.contains('faq__item--abierto');
      document
        .querySelectorAll('.faq__item--abierto')
        .forEach(function (abierto) {
          abierto.classList.remove('faq__item--abierto');
        });
      if (!estaAbierto) {
        item.classList.add('faq__item--abierto');
      }
    });
  });
}

function configurarFormularioContacto() {
  var formulario = document.getElementById('formulario-contacto');
  if (!formulario) return;

  formulario.addEventListener('submit', function (evento) {
    evento.preventDefault();
    var nombre = document.getElementById('contacto-nombre').value.trim();
    var email = document.getElementById('contacto-email').value.trim();
    var categoria = document.getElementById('contacto-categoria').value;
    var mensaje = document.getElementById('contacto-mensaje').value.trim();

    if (!nombre || !email || !categoria || !mensaje) {
      if (window.showToast)
        window.showToast('Por favor completa todos los campos.', {
          tipo: 'error',
        });
      return;
    }

    var regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexEmail.test(email)) {
      if (window.showToast)
        window.showToast('Ingresa un correo electrónico válido.', {
          tipo: 'error',
        });
      return;
    }

    var botonEnviar = formulario.querySelector('.contacto__boton');
    if (botonEnviar) {
      botonEnviar.disabled = true;
      botonEnviar.textContent = 'Enviando...';
    }

    obtenerClienteSupabase().then(function (clienteSupabase) {
      var usuarioId = null;
      var promise = clienteSupabase
        ? clienteSupabase.auth.getSession().then(function (r) {
            if (r.data && r.data.session) usuarioId = r.data.session.user.id;
          })
        : Promise.resolve();

      promise.then(function () {
        fetch('/api/mensajes-ayuda', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre,
            email,
            categoria,
            mensaje,
            usuario_id: usuarioId,
          }),
        })
          .then(function (respuesta) {
            return respuesta.json();
          })
          .then(function (data) {
            if (data.error) {
              if (window.showToast)
                window.showToast('Error al enviar: ' + data.error, {
                  tipo: 'error',
                });
              return;
            }
            formulario.reset();
            if (window.showToast)
              window.showToast(
                '¡Mensaje enviado! Te responderemos en menos de 24 horas.',
                { tipo: 'success', duracion: 6000 },
              );
            prefrellenarFormulario();
            cargarMisConsultas();
          })
          .catch(function () {
            if (window.showToast)
              window.showToast(
                'Error al enviar el mensaje. Inténtalo de nuevo.',
                {
                  tipo: 'error',
                },
              );
          })
          .finally(function () {
            if (botonEnviar) {
              botonEnviar.disabled = false;
              botonEnviar.textContent = 'Enviar mensaje';
            }
          });
      });
    });
  });
}
