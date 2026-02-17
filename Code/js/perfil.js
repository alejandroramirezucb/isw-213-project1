let supa = null;

async function inicializarSupabase() {
  const res = await fetch('/config');
  const { supabaseUrl, supabaseKey } = await res.json();
  supa = window.supabase.createClient(supabaseUrl, supabaseKey);
}

document.addEventListener('DOMContentLoaded', async () => {
  await inicializarSupabase();

  const {
    data: { session },
  } = await supa.auth.getSession();

  if (!session) {
    window.location.href = '/login';
    return;
  }

  await cargarDatosUsuario(session.user);
  await cargarPedidos(session.user.id);
  configurarLogout();
});

async function cargarDatosUsuario(user) {
  try {
    const { data: usuario, error } = await supa
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error al cargar datos del usuario:', error);
      const nombre =
        user.user_metadata.nombre_completo || user.email.split('@')[0];
      document.getElementById('user-nombre').textContent = nombre;
      document.getElementById('user-email').textContent = user.email;
      document.getElementById('user-avatar').textContent = nombre
        .charAt(0)
        .toUpperCase();
      return;
    }

    const nombre = usuario.nombre_completo || user.email.split('@')[0];
    document.getElementById('user-nombre').textContent = nombre;
    document.getElementById('user-email').textContent =
      usuario.correo_electronico;
    document.getElementById('user-avatar').textContent = nombre
      .charAt(0)
      .toUpperCase();

    if (usuario.telefono) {
      const telefonoElem = document.getElementById('user-telefono');
      if (telefonoElem) {
        telefonoElem.textContent = usuario.telefono;
      }
    }

    const rolElem = document.getElementById('user-rol');
    if (rolElem && usuario.rol) {
      const rolTexto =
        usuario.rol === 'administrador'
          ? 'Administrador'
          : usuario.rol === 'chofer'
            ? 'Chofer'
            : 'Cliente';
      rolElem.textContent = rolTexto;
    }
  } catch (err) {
    console.error('Error:', err);
    const nombre =
      user.user_metadata.nombre_completo || user.email.split('@')[0];
    document.getElementById('user-nombre').textContent = nombre;
    document.getElementById('user-email').textContent = user.email;
    document.getElementById('user-avatar').textContent = nombre
      .charAt(0)
      .toUpperCase();
  }
}

async function cargarPedidos(userId) {
  const contenedor = document.getElementById('lista-pedidos');

  const { data: pedidos, error } = await supa
    .from('pedidos')
    .select('*')
    .eq('usuario_id', userId)
    .order('fecha_creacion', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error al cargar pedidos:', error);
    return;
  }

  if (pedidos && pedidos.length > 0) {
    contenedor.innerHTML = '';
    pedidos.forEach((pedido) => {
      const div = document.createElement('div');
      div.className = 'item-pedido';
      const fecha = new Date(pedido.fecha_creacion).toLocaleDateString('es-BO');

      div.innerHTML = `
                <div class="pedido-info">
                    <span class="pedido-id">Pedido #${pedido.id}</span>
                    <span class="pedido-fecha">${fecha} - Bs. ${pedido.monto_total.toFixed(2)}</span>
                </div>
                <div class="pedido-estado estado-${pedido.estado.replace(/ /g, '-')}">${pedido.estado}</div>
            `;
      contenedor.appendChild(div);
    });

    const verTodosBtn = document.createElement('a');
    verTodosBtn.href = '/historial';
    verTodosBtn.className = 'btn-ver-todos';
    verTodosBtn.textContent = 'Ver Todos los Pedidos';
    verTodosBtn.style.cssText =
      'display: block; text-align: center; margin-top: 15px; padding: 10px; background: #034e8b; color: white; border-radius: 8px; text-decoration: none; font-weight: 500;';
    contenedor.appendChild(verTodosBtn);
  } else {
    contenedor.innerHTML =
      '<p style="color: #888; text-align: center; padding: 20px;">No tienes pedidos aún</p>';
  }
}

function configurarLogout() {
  document.getElementById('btn-logout').addEventListener('click', async () => {
    await supa.auth.signOut();
    window.location.href = '/login';
  });
}
