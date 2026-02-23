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
        cargarDatosUsuario(clienteSupabase, sesion.user);
        cargarPedidos(clienteSupabase, sesion.user.id);
        configurarLogout(clienteSupabase);
      });
    });
  });
});

function getEstadoLabel(estado) {
  if (!estado) return '';
  if (estado === 'recibido') return 'Orden realizada';
  return estado.replace(/-/g, ' ').replace(/\b\w/g, function (c) {
    return c.toUpperCase();
  });
}

function cargarDatosUsuario(clienteSupabase, user) {
  clienteSupabase
    .from('usuarios')
    .select('*')
    .eq('id', user.id)
    .single()
    .then(function (resultado) {
      var nombre;

      if (resultado.error) {
        console.error('Error al cargar datos del usuario:', resultado.error);
        nombre =
          (user.user_metadata && user.user_metadata.nombre_completo) ||
          user.email.split('@')[0];
        document.getElementById('user-nombre').textContent = nombre;
        document.getElementById('user-email').textContent = user.email;
        document.getElementById('user-avatar').textContent = nombre
          .charAt(0)
          .toUpperCase();
        return;
      }

      var usuario = resultado.data;
      nombre = usuario.nombre_completo || user.email.split('@')[0];
      document.getElementById('user-nombre').textContent = nombre;
      document.getElementById('user-email').textContent =
        usuario.correo_electronico;
      document.getElementById('user-avatar').textContent = nombre
        .charAt(0)
        .toUpperCase();

      if (usuario.telefono) {
        var telefonoElem = document.getElementById('user-telefono');
        if (telefonoElem) {
          telefonoElem.textContent = usuario.telefono;
        }
      }

      var rolElem = document.getElementById('user-rol');
      if (rolElem && usuario.rol) {
        var rolTexto =
          usuario.rol === 'administrador'
            ? 'Administrador'
            : usuario.rol === 'chofer'
              ? 'Chofer'
              : 'Cliente';
        rolElem.textContent = rolTexto;
      }
    })
    .catch(function (err) {
      console.error('Error:', err);
      var nombre =
        (user.user_metadata && user.user_metadata.nombre_completo) ||
        user.email.split('@')[0];
      document.getElementById('user-nombre').textContent = nombre;
      document.getElementById('user-email').textContent = user.email;
      document.getElementById('user-avatar').textContent = nombre
        .charAt(0)
        .toUpperCase();
    });
}

function cargarPedidos(clienteSupabase, userId) {
  var contenedor = document.getElementById('lista-pedidos');

  clienteSupabase
    .from('pedidos')
    .select('*')
    .eq('usuario_id', userId)
    .order('fecha_creacion', { ascending: false })
    .limit(5)
    .then(function (resultado) {
      if (resultado.error) {
        console.error('Error al cargar pedidos:', resultado.error);
        return;
      }

      var pedidos = resultado.data;

      if (pedidos && pedidos.length > 0) {
        while (contenedor.firstChild)
          contenedor.removeChild(contenedor.firstChild);

        pedidos.forEach(function (pedido) {
          var div = document.createElement('div');
          div.className = 'item-pedido';

          var divInfo = document.createElement('div');
          divInfo.className = 'pedido-info';

          var spanId = document.createElement('span');
          spanId.className = 'pedido-id';
          spanId.textContent = 'Pedido #' + pedido.id;
          divInfo.appendChild(spanId);

          var fecha = new Date(pedido.fecha_creacion).toLocaleDateString(
            'es-BO',
          );
          var spanFecha = document.createElement('span');
          spanFecha.className = 'pedido-fecha';
          spanFecha.textContent =
            fecha + ' - Bs. ' + pedido.monto_total.toFixed(2);
          divInfo.appendChild(spanFecha);

          div.appendChild(divInfo);

          var divEstado = document.createElement('div');
          divEstado.className =
            'pedido-estado estado-' + pedido.estado.replace(/ /g, '-');
          divEstado.textContent = getEstadoLabel(pedido.estado);
          div.appendChild(divEstado);

          contenedor.appendChild(div);
        });
      } else {
        while (contenedor.firstChild)
          contenedor.removeChild(contenedor.firstChild);
        var p = document.createElement('p');
        p.style.cssText = 'color: #888; text-align: center; padding: 20px;';
        p.textContent = 'No tienes pedidos aún';
        contenedor.appendChild(p);
      }
    });
}

function configurarLogout(clienteSupabase) {
  var btnLogout = document.getElementById('btn-logout');
  if (!btnLogout) return;

  btnLogout.addEventListener('click', function () {
    clienteSupabase.auth.signOut().then(function () {
      window.location.href = '/login';
    });
  });
}
