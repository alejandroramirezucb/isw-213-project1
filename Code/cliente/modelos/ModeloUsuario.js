class ModeloUsuario {
  constructor(clienteSupabase) {
    this._supabase = clienteSupabase;
  }

  async cargar(user) {
    const { data, error } = await this._supabase
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .single();

    const nombre = data?.nombre_completo || user.user_metadata?.nombre_completo || user.email.split('@')[0];
    const usuario = error
      ? { nombre, correo_electronico: user.email, rol: 'cliente' }
      : { ...data, nombre };

    document.dispatchEvent(new CustomEvent('usuario:cargado', { detail: { usuario } }));
  }

  async cargarPedidosRecientes(usuarioId) {
    const { data: pedidos } = await this._supabase
      .from('pedidos')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('fecha_creacion', { ascending: false })
      .limit(5);

    document.dispatchEvent(new CustomEvent('usuario:pedidosCargados', {
      detail: { pedidos: pedidos || [] },
    }));
  }
}

export default ModeloUsuario;
