class ControladorPerfil {
  constructor(modeloUsuario, clienteSupabase) {
    this._modelo = modeloUsuario;
    this._supabase = clienteSupabase;
    this._inicializar();
  }

  async _inicializar() {
    const { data } = await this._supabase.auth.getSession();
    const sesion = data.session;
    if (!sesion) { window.location.href = '/login'; return; }

    await this._modelo.cargar(sesion.user);
    await this._modelo.cargarPedidosRecientes(sesion.user.id);
    this._bindLogout();
  }

  _bindLogout() {
    const btnLogout = document.getElementById('btn-logout');
    btnLogout?.addEventListener('click', async () => {
      await this._supabase.auth.signOut();
      window.location.href = '/login';
    });
  }
}

export default ControladorPerfil;
