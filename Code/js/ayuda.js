document.addEventListener('DOMContentLoaded', function () {
  cargarNavbar().then(function () {
    prefrellenarFormulario();
    configurarFAQ();
    configurarFormularioContacto();
  });
});

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

    fetch('/api/mensajes-ayuda', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, categoria, mensaje }),
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
      })
      .catch(function () {
        if (window.showToast)
          window.showToast('Error al enviar el mensaje. Inténtalo de nuevo.', {
            tipo: 'error',
          });
      })
      .finally(function () {
        if (botonEnviar) {
          botonEnviar.disabled = false;
          botonEnviar.textContent = 'Enviar mensaje';
        }
      });
  });
}
