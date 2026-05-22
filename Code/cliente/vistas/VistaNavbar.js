class VistaNavbar {
  constructor(clienteSupabase) {
    this._supabase = clienteSupabase;
    this._inicializarMenuMovil();
    this._inicializarDropdownCategorias();
    this._actualizarIconoUsuario();
  }

  _inicializarMenuMovil() {
    const botonMenu = document.querySelector('.barra-navegacion__icono-menu');
    const listaEnlaces = document.querySelector('.barra-navegacion__enlaces');
    if (!botonMenu || !listaEnlaces) return;

    botonMenu.addEventListener('click', () => {
      listaEnlaces.classList.toggle('barra-navegacion__enlaces--visible');
    });
  }

  _inicializarDropdownCategorias() {
    document.querySelectorAll('.barra-navegacion__enlace-categoria').forEach((enlace) => {
      enlace.addEventListener('click', (evento) => {
        const nombreCategoria = enlace.getAttribute('data-categoria') || enlace.textContent.trim().toLowerCase();
        if (typeof controladorProductos !== 'undefined' && controladorProductos) {
          evento.preventDefault();
          controladorProductos.cargarProductos({ categoria: nombreCategoria });
          const desplegable = document.querySelector('.barra-navegacion__desplegable');
          if (desplegable) desplegable.classList.remove('barra-navegacion__desplegable--visible');
        }
      });
    });
  }

  _actualizarIconoUsuario() {
    if (!this._supabase) return;

    const aplicarEstado = (sesion) => {
      const enlaceUsuario = document.querySelector('.barra-navegacion__enlace-icono[aria-label="Mi cuenta"]');
      if (!enlaceUsuario) return;

      if (sesion) {
        enlaceUsuario.classList.add('usuario-logueado');
        enlaceUsuario.href = '/perfil';
        this._mostrarIconosPorRol(sesion.user);
      } else {
        enlaceUsuario.classList.remove('usuario-logueado');
        enlaceUsuario.href = '/login';
        this._ocultarIconosRol();
      }
    };

    this._supabase.auth.onAuthStateChange((evento, sesion) => {
      aplicarEstado(sesion);
      if (sesion && (evento === 'INITIAL_SESSION' || evento === 'SIGNED_IN')) {
        this._suscribirsePedidos(sesion.user.id);
      }
    });

    this._supabase.auth.getSession().then(({ data }) => aplicarEstado(data.session));
  }

  _mostrarIconosPorRol(usuario) {
    this._supabase.from('usuarios').select('rol').eq('id', usuario.id).single().then(({ data, error }) => {
      if (error || !data) return;
      const enlaceAdmin = document.querySelector('.barra-navegacion__enlace-icono--admin');
      const enlaceChofer = document.querySelector('.barra-navegacion__enlace-icono--chofer');
      if (enlaceAdmin) enlaceAdmin.style.display = data.rol === 'administrador' ? 'block' : 'none';
      if (enlaceChofer) enlaceChofer.style.display = data.rol === 'chofer' ? 'block' : 'none';
    });
  }

  _ocultarIconosRol() {
    const enlaceAdmin = document.querySelector('.barra-navegacion__enlace-icono--admin');
    const enlaceChofer = document.querySelector('.barra-navegacion__enlace-icono--chofer');
    if (enlaceAdmin) enlaceAdmin.style.display = 'none';
    if (enlaceChofer) enlaceChofer.style.display = 'none';
  }

  _suscribirsePedidos(idUsuario) {
    this._supabase
      .channel(`pedidos-usuario-${idUsuario}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `usuario_id=eq.${idUsuario}` }, (payload) => {
        const pedido = payload.new;
        if (window.showToast && pedido.estado) {
          window.showToast(`Tu pedido #${pedido.id} cambió a: ${pedido.estado}`, { tipo: 'info', duracion: 6000 });
        }
      })
      .subscribe();
  }
}

export default VistaNavbar;
