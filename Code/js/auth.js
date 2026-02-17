window.supabaseClient = window.supabaseClient || null;

async function inicializarSupabase() {
  try {
    const res = await fetch('/config');
    if (!res.ok) {
      showToast(
        'Error al obtener configuración del servidor (' + res.status + ')',
        { type: 'error', duration: 8000 },
      );
      return false;
    }
    const config = await res.json();
    if (!config.supabaseUrl || !config.supabaseKey) {
      showToast(
        'Configuración de Supabase incompleta. Revisa las variables SUPABASE_URL y SUPABASE_ANON_KEY en el servidor.',
        { type: 'error', duration: 8000 },
      );
      return false;
    }
    if (!window.supabase) {
      showToast(
        'Librería de Supabase no cargada. Revisa tu conexión a internet.',
        { type: 'error', duration: 8000 },
      );
      return false;
    }

    window.supabaseClient = window.supabase.createClient(
      config.supabaseUrl,
      config.supabaseKey,
    );
    return true;
  } catch (err) {
    showToast('Error de red al conectar con el servidor: ' + err.message, {
      type: 'error',
      duration: 8000,
    });
    return false;
  }
}

function manejarRutaActual() {
  const path = window.location.pathname.toLowerCase();
  const loginView = document.getElementById('login-view');
  const registroView = document.getElementById('registro-view');
  if (!loginView || !registroView) return;
  if (path.includes('/register') || window.location.hash === '#register') {
    loginView.style.display = 'none';
    registroView.style.display = 'block';
  } else {
    loginView.style.display = 'block';
    registroView.style.display = 'none';
  }
}

function configurarVistas() {
  const irARegistro = document.getElementById('ir-a-registro');
  const irALogin = document.getElementById('ir-a-login');
  if (irARegistro) {
    irARegistro.addEventListener('click', (e) => {
      e.preventDefault();
      window.history.pushState({}, '', '/register');
      manejarRutaActual();
    });
  }
  if (irALogin) {
    irALogin.addEventListener('click', (e) => {
      e.preventDefault();
      window.history.pushState({}, '', '/login');
      manejarRutaActual();
    });
  }
}

function configurarLogin() {
  const formLogin = document.getElementById('form-login');
  if (!formLogin) return;

  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email')?.value?.trim();
    const password = document.getElementById('password')?.value;
    const btn = formLogin.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;

    if (!window.supabaseClient) {
      showToast('Servicio de autenticación no disponible. Recarga la página.', {
        type: 'error',
      });
      if (btn) btn.disabled = false;
      return;
    }

    try {
      const { data, error } =
        await window.supabaseClient.auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        let mensaje = error.message;
        if (mensaje === 'Invalid login credentials')
          mensaje = 'Correo o contraseña incorrectos.';
        else if (mensaje === 'Email not confirmed')
          mensaje = 'Debes confirmar tu correo antes de iniciar sesión.';
        showToast('Error al iniciar sesión: ' + mensaje, {
          type: 'error',
          duration: 7000,
        });
        return;
      }

      if (data && data.session) {
        showToast('¡Sesión iniciada!', { type: 'success', duration: 2000 });
        setTimeout(() => {
          window.location.href = '/';
        }, 600);
      } else {
        showToast('Respuesta inesperada. Intenta de nuevo.', {
          type: 'warning',
        });
      }
    } catch (err) {
      showToast('Error inesperado: ' + err.message, {
        type: 'error',
        duration: 7000,
      });
    } finally {
      if (btn) btn.disabled = false;
    }
  });
}

async function sincronizarUsuarioFallback(
  id,
  nombre_completo,
  correo_electronico,
  telefono,
  rol,
) {
  try {
    const res = await fetch('/api/usuarios/fallback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        nombre_completo,
        correo_electronico,
        telefono,
        rol,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      return {
        ok: false,
        error: json.error || 'Error desconocido en fallback',
      };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function configurarRegistro() {
  const formRegistro = document.getElementById('form-registro');
  if (!formRegistro) return;

  formRegistro.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('reg-nombre')?.value?.trim();
    const email = document.getElementById('reg-email')?.value?.trim();
    const password = document.getElementById('reg-password')?.value;
    const telefonoLocal =
      document.getElementById('reg-telefono-local')?.value?.trim() || null;
    const rol = document.getElementById('reg-rol')?.value || 'cliente';
    const btn = formRegistro.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;

    if (!nombre || !email || !password) {
      showToast('Completa todos los campos obligatorios.', { type: 'warning' });
      if (btn) btn.disabled = false;
      return;
    }

    if (!window.supabaseClient) {
      showToast('Servicio de autenticación no disponible. Recarga la página.', {
        type: 'error',
      });
      if (btn) btn.disabled = false;
      return;
    }

    const telefono = telefonoLocal
      ? '+591' + telefonoLocal.replace(/\D/g, '')
      : null;

    try {
      showToast('Creando cuenta...', { type: 'info', duration: 3000 });

      const { data, error } = await window.supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: { nombre_completo: nombre, rol: rol, telefono: telefono },
        },
      });

      if (error) {
        let mensaje = error.message;
        if (
          mensaje.includes('already registered') ||
          mensaje.includes('already been registered')
        ) {
          mensaje = 'Este correo ya está registrado. Intenta iniciar sesión.';
        } else if (mensaje.includes('Password should be')) {
          mensaje = 'La contraseña debe tener al menos 6 caracteres.';
        }
        showToast('Error al registrar: ' + mensaje, {
          type: 'error',
          duration: 8000,
        });
        return;
      }

      if (!data || !data.user) {
        showToast('No se recibió respuesta del servidor. Intenta de nuevo.', {
          type: 'error',
        });
        return;
      }

      const syncResult = await sincronizarUsuarioFallback(
        data.user.id,
        nombre,
        email,
        telefono,
        rol,
      );
      if (!syncResult.ok) {
        showToast('Aviso: ' + syncResult.error, {
          type: 'warning',
          duration: 6000,
        });
      }

      if (data.session) {
        showToast('¡Cuenta creada exitosamente! Redirigiendo...', {
          type: 'success',
          duration: 2500,
        });
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
        return;
      }

      showToast(
        'Cuenta creada. Revisa tu correo (' +
          email +
          ') para confirmar tu cuenta.',
        { type: 'success', duration: 10000 },
      );
    } catch (err) {
      showToast('Error inesperado al registrarse: ' + err.message, {
        type: 'error',
        duration: 8000,
      });
    } finally {
      if (btn) btn.disabled = false;
    }
  });
}

function configurarOAuth() {
  const btnGoogle = document.getElementById('btn-google');
  const btnApple = document.getElementById('btn-apple');

  if (btnGoogle) {
    btnGoogle.onclick = async () => {
      if (!window.supabaseClient) {
        showToast('OAuth no disponible.', { type: 'warning' });
        return;
      }
      try {
        const { error } = await window.supabaseClient.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin + '/' },
        });
        if (error)
          showToast('Error Google: ' + error.message, { type: 'error' });
      } catch (err) {
        showToast('Error Google: ' + err.message, { type: 'error' });
      }
    };
  }

  if (btnApple) {
    btnApple.onclick = async () => {
      if (!window.supabaseClient) {
        showToast('OAuth no disponible.', { type: 'warning' });
        return;
      }
      try {
        const { error } = await window.supabaseClient.auth.signInWithOAuth({
          provider: 'apple',
          options: { redirectTo: window.location.origin + '/' },
        });
        if (error)
          showToast('Error Apple: ' + error.message, { type: 'error' });
      } catch (err) {
        showToast('Error Apple: ' + err.message, { type: 'error' });
      }
    };
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  configurarVistas();
  manejarRutaActual();
  window.addEventListener('popstate', manejarRutaActual);

  const ok = await inicializarSupabase();

  if (ok && window.supabaseClient) {
    try {
      const {
        data: { session },
      } = await window.supabaseClient.auth.getSession();
      if (session) {
        window.location.href = '/';
        return;
      }
    } catch (e) {
      console.error('Error al verificar sesión activa:', e);
    }
  }

  configurarLogin();
  configurarRegistro();
  configurarOAuth();
});
