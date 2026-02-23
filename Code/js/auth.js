document.addEventListener('DOMContentLoaded', function () {
  cargarNavbar();

  var formularioLogin = document.getElementById('formularioLogin');
  var formularioRegistro = document.getElementById('formularioRegistro');

  if (formularioLogin) {
    formularioLogin.addEventListener('submit', function (evento) {
      evento.preventDefault();
      iniciarSesion();
    });
  }

  if (formularioRegistro) {
    formularioRegistro.addEventListener('submit', function (evento) {
      evento.preventDefault();
      registrarUsuario();
    });
  }
});

function iniciarSesion() {
  var correo = document.getElementById('correoLogin');
  var contrasena = document.getElementById('contrasenaLogin');

  if (!correo || !contrasena || !correo.value.trim() || !contrasena.value) {
    if (window.showToast) {
      window.showToast('Completa todos los campos', { tipo: 'warning' });
    }
    return;
  }

  obtenerClienteSupabase().then(function (clienteSupabase) {
    if (!clienteSupabase) {
      if (window.showToast) {
        window.showToast('Error de conexión', { tipo: 'error' });
      }
      return;
    }

    clienteSupabase.auth
      .signInWithPassword({
        email: correo.value.trim(),
        password: contrasena.value,
      })
      .then(function (resultado) {
        if (resultado.error) {
          if (window.showToast) {
            window.showToast('Credenciales incorrectas', { tipo: 'error' });
          }
          return;
        }

        if (window.showToast) {
          window.showToast('Sesión iniciada correctamente', {
            tipo: 'success',
          });
        }
        setTimeout(function () {
          window.location.href = '/';
        }, 1000);
      });
  });
}

function registrarUsuario() {
  var nombre = document.getElementById('nombreRegistro');
  var correo = document.getElementById('correoRegistro');
  var contrasena = document.getElementById('contrasenaRegistro');
  var confirmar = document.getElementById('confirmarContrasena');

  if (!correo || !contrasena || !nombre) {
    if (window.showToast) {
      window.showToast('Completa todos los campos', { tipo: 'warning' });
    }
    return;
  }

  if (confirmar && contrasena.value !== confirmar.value) {
    if (window.showToast) {
      window.showToast('Las contraseñas no coinciden', { tipo: 'warning' });
    }
    return;
  }

  obtenerClienteSupabase().then(function (clienteSupabase) {
    if (!clienteSupabase) {
      if (window.showToast) {
        window.showToast('Error de conexión', { tipo: 'error' });
      }
      return;
    }

    clienteSupabase.auth
      .signUp({
        email: correo.value.trim(),
        password: contrasena.value,
        options: {
          data: { nombre: nombre.value.trim() },
        },
      })
      .then(function (resultado) {
        if (resultado.error) {
          if (window.showToast) {
            window.showToast('Error al registrar: ' + resultado.error.message, {
              tipo: 'error',
            });
          }
          return;
        }

        return guardarUsuarioEnBaseDatos(
          clienteSupabase,
          resultado.data.user,
          nombre.value.trim(),
        );
      })
      .then(function () {
        if (window.showToast) {
          window.showToast(
            'Registro exitoso. Revisa tu correo para confirmar.',
            {
              tipo: 'success',
              duracion: 5000,
            },
          );
        }
        setTimeout(function () {
          window.location.href = '/login';
        }, 2000);
      });
  });
}

function guardarUsuarioEnBaseDatos(clienteSupabase, usuario, nombre) {
  if (!usuario) return Promise.resolve();

  return clienteSupabase
    .from('usuarios')
    .upsert({
      id: usuario.id,
      correo_electronico: usuario.email,
      nombre_completo: nombre,
      rol: 'cliente',
    })
    .then(function (resultado) {
      if (resultado.error) {
        return fetch('/api/usuarios/fallback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: usuario.id,
            correo_electronico: usuario.email,
            nombre_completo: nombre,
            rol: 'cliente',
          }),
        });
      }
    });
}
