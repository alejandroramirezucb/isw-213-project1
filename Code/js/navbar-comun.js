function cargarNavbar() {
  var contenedorNavbar = document.getElementById('navbar-container');
  if (!contenedorNavbar) return Promise.resolve();

  return fetch('/api/navbar')
    .then(function (respuesta) {
      return respuesta.text();
    })
    .then(function (html) {
      var parser = new DOMParser();
      var doc = parser.parseFromString(html, 'text/html');
      while (contenedorNavbar.firstChild)
        contenedorNavbar.removeChild(contenedorNavbar.firstChild);
      while (doc.body.firstChild)
        contenedorNavbar.appendChild(doc.body.firstChild);
      inicializarMenuMovil();
      inicializarDropdownCategorias();
      actualizarIconoUsuario();

      var carritoServicio = new CarritoServicio();
      var actualizadorContador = new ActualizadorContador(carritoServicio);
      actualizadorContador.actualizar();
    });
}

function inicializarMenuMovil() {
  var botonMenu = document.querySelector('.barra-navegacion__icono-menu');
  var listaEnlaces = document.querySelector('.barra-navegacion__enlaces');
  if (!botonMenu || !listaEnlaces) return;

  botonMenu.addEventListener('click', function () {
    listaEnlaces.classList.toggle('barra-navegacion__enlaces--visible');
  });
}

function inicializarDropdownCategorias() {
  var enlacesCategorias = document.querySelectorAll(
    '.barra-navegacion__enlace-categoria',
  );

  enlacesCategorias.forEach(function (enlace) {
    enlace.addEventListener('click', function (evento) {
      var nombreCategoria =
        enlace.getAttribute('data-categoria') ||
        enlace.textContent.trim().toLowerCase();

      if (typeof controladorProductos !== 'undefined' && controladorProductos) {
        evento.preventDefault();
        controladorProductos.cargarProductos({ categoria: nombreCategoria });
        var desplegable = document.querySelector(
          '.barra-navegacion__desplegable',
        );
        if (desplegable)
          desplegable.classList.remove(
            'barra-navegacion__desplegable--visible',
          );
      }
    });
  });
}

function actualizarIconoUsuario() {
  obtenerClienteSupabase().then(function (clienteSupabase) {
    if (!clienteSupabase) return;

    function aplicarEstadoSesion(sesion) {
      var enlaceUsuario = document.querySelector(
        '.barra-navegacion__enlace-icono[aria-label="Mi cuenta"]',
      );
      if (!enlaceUsuario) return;

      if (sesion) {
        enlaceUsuario.classList.add('usuario-logueado');
        enlaceUsuario.href = '/perfil';
      } else {
        enlaceUsuario.classList.remove('usuario-logueado');
        enlaceUsuario.href = '/login';
      }
    }

    // onAuthStateChange dispara inmediatamente con el estado actual (INITIAL_SESSION)
    // y tambien cuando cambia (SIGNED_IN, SIGNED_OUT), siendo mas confiable que getSession
    clienteSupabase.auth.onAuthStateChange(function (evento, sesion) {
      aplicarEstadoSesion(sesion);
      if (sesion && (evento === 'INITIAL_SESSION' || evento === 'SIGNED_IN')) {
        suscribirsePedidosUsuario(clienteSupabase, sesion.user.id);
      }
    });

    // Chequeo inmediato como respaldo por si onAuthStateChange tarda
    clienteSupabase.auth.getSession().then(function (resultado) {
      aplicarEstadoSesion(resultado.data.session);
    });
  });
}

function suscribirsePedidosUsuario(clienteSupabase, idUsuario) {
  clienteSupabase
    .channel('pedidos-usuario-' + idUsuario)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'pedidos',
        filter: 'usuario_id=eq.' + idUsuario,
      },
      function (payload) {
        var pedido = payload.new;
        if (window.showToast && pedido.estado) {
          window.showToast(
            'Tu pedido #' + pedido.id + ' cambió a: ' + pedido.estado,
            { tipo: 'info', duracion: 6000 },
          );
        }
      },
    )
    .subscribe();
}
