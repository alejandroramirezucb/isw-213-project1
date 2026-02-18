async function actualizarIconoUsuario() {
  try {
    const res = await fetch('/config');
    if (!res.ok) {
      console.warn(
        'No se pudo obtener /config — omitiendo actualización del icono de usuario',
      );
      fallbackUsuarioNoAutenticado();
      return;
    }

    const { supabaseUrl, supabaseKey } = await res.json();

    if (!supabaseUrl || !supabaseKey || !window.supabase) {
      console.warn(
        'Supabase no está disponible en el cliente o faltan credenciales. Mostrando estado por defecto.',
      );
      fallbackUsuarioNoAutenticado();
      return;
    }

    const supabaseClient = window.supabase.createClient(
      supabaseUrl,
      supabaseKey,
    );

    const {
      data: { session },
    } = await supabaseClient.auth.getSession();
    const linkUsuario = document.querySelector('a[href="/user"]');
    const linkHistorial = document.querySelector('a[href="/historial"]');
    const linkAdmin = document.getElementById('admin-icon-link');

    if (linkUsuario) {
      if (session) {
        linkUsuario.setAttribute('href', '/perfil');
        linkUsuario.setAttribute('title', 'Mi Perfil');

        const iconoFilled = linkUsuario.querySelector(
          '.barra-navegacion__icon--filled',
        );
        const iconoLine = linkUsuario.querySelector(
          '.barra-navegacion__icon--line',
        );
        if (iconoFilled && iconoLine) {
          iconoFilled.style.display = 'block';
          iconoFilled.style.opacity = '1';
          iconoLine.style.display = 'none';
        }

        const { data: usuario, error } = await supabaseClient
          .from('usuarios')
          .select('rol')
          .eq('id', session.user.id)
          .single();

        if (!error && usuario && usuario.rol === 'administrador' && linkAdmin) {
          linkAdmin.style.display = 'block';
        }
      } else {
        linkUsuario.setAttribute('href', '/login');
        linkUsuario.setAttribute('title', 'Iniciar Sesión');
        const iconoFilled = linkUsuario.querySelector(
          '.barra-navegacion__icon--filled',
        );
        const iconoLine = linkUsuario.querySelector(
          '.barra-navegacion__icon--line',
        );
        if (iconoFilled && iconoLine) {
          iconoFilled.style.display = 'none';
          iconoLine.style.display = 'block';
        }
      }
    }

    if (linkHistorial) {
      if (!session) {
        linkHistorial.addEventListener('click', (e) => {
          e.preventDefault();
          showToast('Debes iniciar sesión para ver tu historial.', {
            type: 'info',
            duration: 1200,
          });
          setTimeout(() => (window.location.href = '/login'), 600);
        });
      }
    }
  } catch (e) {
    console.error('Error al actualizar icono de usuario:', e);
    fallbackUsuarioNoAutenticado();
  }
}

function fallbackUsuarioNoAutenticado() {
  const linkUsuario = document.querySelector('a[href="/user"]');
  if (!linkUsuario) return;
  linkUsuario.setAttribute('href', '/login');
  linkUsuario.setAttribute('title', 'Iniciar Sesión');
  const iconoFilled = linkUsuario.querySelector(
    '.barra-navegacion__icon--filled',
  );
  const iconoLine = linkUsuario.querySelector('.barra-navegacion__icon--line');
  if (iconoFilled && iconoLine) {
    iconoFilled.style.display = 'none';
    iconoLine.style.display = 'block';
  }
}

function inicializarDropdownCategorias() {
  const enlaces = document.querySelectorAll('.barra-navegacion__dropdown-link');
  enlaces.forEach((enlace) => {
    enlace.addEventListener('click', (e) => {
      const href = enlace.getAttribute('href');
      if (window.location.pathname !== '/') return;

      e.preventDefault();
      const url = new URL(enlace.href);
      const categoria = url.searchParams.get('categoria');
      if (categoria && typeof controladorProductos !== 'undefined')
        controladorProductos.cargarProductos({ categoria });
    });
  });

  const btnToggle = document.getElementById('btn-toggle-filtros');
  if (btnToggle) {
    btnToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const existing = document.getElementById('panel-filtros');
      if (existing) {
        existing.style.display =
          existing.style.display === 'block' ? 'none' : 'block';
        return;
      }
      const header =
        document.getElementById('navbar-placeholder') ||
        document.querySelector('header');
      const panelHtml = `
        <div id="panel-filtros" class="panel-filtros">
          <div class="filtros-contenedor">
            <div class="filtro-grupo">
              <label for="filtro-precio-minimo">Precio Mínimo:</label>
              <input type="number" id="filtro-precio-minimo" min="0" step="0.01" placeholder="$0.00" />
            </div>
            <div class="filtro-grupo">
              <label for="filtro-precio-maximo">Precio Máximo:</label>
              <input type="number" id="filtro-precio-maximo" min="0" step="0.01" placeholder="$999.99" />
            </div>
            <div class="filtro-grupo">
              <label for="filtro-solo-disponibles"><input type="checkbox" id="filtro-solo-disponibles" /> Solo productos disponibles</label>
            </div>
            <div class="filtro-acciones">
              <button id="btn-aplicar-filtros" class="btn-primary">Aplicar Filtros</button>
              <button id="btn-limpiar-filtros" class="btn-secondary">Limpiar</button>
            </div>
          </div>
        </div>`;
      if (header && header.parentNode)
        header.insertAdjacentHTML('afterend', panelHtml);
      else document.body.insertAdjacentHTML('afterbegin', panelHtml);

      const aplicar = document.getElementById('btn-aplicar-filtros');
      const limpiar = document.getElementById('btn-limpiar-filtros');

      function aplicarFiltrosLocal() {
        const precioMin = document.getElementById(
          'filtro-precio-minimo',
        )?.value;
        const precioMax = document.getElementById(
          'filtro-precio-maximo',
        )?.value;
        const soloDisp = document.getElementById(
          'filtro-solo-disponibles',
        )?.checked;
        const params = new URLSearchParams();
        if (precioMin) params.set('precioMinimo', precioMin);
        if (precioMax) params.set('precioMaximo', precioMax);
        if (soloDisp) params.set('soloDisponibles', 'true');
        window.location.href =
          '/' +
          (params.toString()
            ? '?' + params.toString() + '&filtros=show'
            : '?filtros=show');
      }

      function limpiarFiltrosLocal() {
        const pmin = document.getElementById('filtro-precio-minimo');
        const pmax = document.getElementById('filtro-precio-maximo');
        const sdisp = document.getElementById('filtro-solo-disponibles');
        if (pmin) pmin.value = '';
        if (pmax) pmax.value = '';
        if (sdisp) sdisp.checked = false;
      }

      if (aplicar) aplicar.addEventListener('click', aplicarFiltrosLocal);
      if (limpiar) limpiar.addEventListener('click', limpiarFiltrosLocal);

      document.addEventListener('click', function onDocClick(ev) {
        const panel = document.getElementById('panel-filtros');
        if (!panel) return document.removeEventListener('click', onDocClick);
        const toggle = document.getElementById('btn-toggle-filtros');
        if (
          !panel.contains(ev.target) &&
          toggle &&
          !toggle.contains(ev.target)
        ) {
          panel.style.display = 'none';
          document.removeEventListener('click', onDocClick);
        }
      });
    });
  }
}

let pedidosChannel = null;
let pedidosChannelUserId = null;

function mapEstadoLabel(estado) {
  if (!estado) return '';
  if (estado === 'recibido') return 'Orden realizada';
  return estado.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function suscribirsePedidosUsuario(userId, supabaseClient) {
  if (!userId || !supabaseClient) return;
  if (pedidosChannel && pedidosChannelUserId === userId) return; // ya suscrito
  if (pedidosChannel) {
    pedidosChannel.unsubscribe();
    pedidosChannel = null;
    pedidosChannelUserId = null;
  }

  pedidosChannel = supabaseClient
    .channel('user-pedidos-' + userId)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'pedidos',
        filter: `usuario_id=eq.${userId}`,
      },
      (payload) => {
        const estado = payload.new?.estado;
        if (estado) {
          showToast(
            `Pedido #${payload.new.id} cambió a: ${mapEstadoLabel(estado)}`,
            { type: 'info', duration: 6000 },
          );
        }
      },
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'pedidos',
        filter: `usuario_id=eq.${userId}`,
      },
      (payload) => {
        const estado = payload.new?.estado;
        showToast(
          `Nuevo pedido #${payload.new.id}: ${mapEstadoLabel(estado)}`,
          { type: 'success', duration: 6000 },
        );
      },
    )
    .subscribe();

  pedidosChannelUserId = userId;
}

function unsubscribePedidos() {
  if (!pedidosChannel) return;
  pedidosChannel.unsubscribe();
  pedidosChannel = null;
  pedidosChannelUserId = null;
}
