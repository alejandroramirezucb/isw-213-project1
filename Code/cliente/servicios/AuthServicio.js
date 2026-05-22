class AuthServicio {
  constructor(clienteSupabase) {
    this._supabase = clienteSupabase;
  }

  async iniciarSesion(correo, contrasena) {
    const { data, error } = await this._supabase.auth.signInWithPassword({
      email: correo,
      password: contrasena,
    });
    if (error) throw new Error('Credenciales incorrectas');
    return data;
  }

  async registrar(correo, contrasena, nombre, rol) {
    const { data, error } = await this._supabase.auth.signUp({
      email: correo,
      password: contrasena,
      options: { data: { nombre, rol } },
    });
    if (error) throw new Error(error.message);
    return data;
  }

  async guardarUsuario(usuario, nombre, rol, telefono) {
    if (!usuario) return;
    const rolFinal = rol || 'cliente';
    const { error } = await this._supabase.from('usuarios').upsert({
      id: usuario.id,
      correo_electronico: usuario.email,
      nombre_completo: nombre,
      telefono: telefono || null,
      rol: rolFinal,
    });
    if (error) {
      await fetch('/api/usuarios/fallback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: usuario.id,
          correo_electronico: usuario.email,
          nombre_completo: nombre,
          rol: rolFinal,
        }),
      });
    }
  }

  async obtenerSesion() {
    const { data } = await this._supabase.auth.getSession();
    return data.session;
  }

  async cerrarSesion() {
    await this._supabase.auth.signOut();
  }

  async verificarRol(usuarioId, rol) {
    const { data, error } = await this._supabase
      .from('usuarios')
      .select('rol')
      .eq('id', usuarioId)
      .single();
    if (error || !data) return false;
    return data.rol === rol;
  }
}

export default AuthServicio;
