class ModeloProductoAdmin {
  constructor(clienteSupabase) {
    this._supabase = clienteSupabase;
  }

  async cargar() {
    const [resProductos, resCategorias] = await Promise.all([
      this._supabase.from('productos').select('*').order('nombre'),
      this._supabase.from('categorias').select('id, nombre'),
    ]);
    const productos = resProductos.data || [];
    const categorias = resCategorias.data || [];
    document.dispatchEvent(new CustomEvent('catalogo:cargado', {
      detail: { productos, categorias },
    }));
  }

  async guardar(datos, id) {
    const operacion = id
      ? this._supabase.from('productos').update(datos).eq('id', id)
      : this._supabase.from('productos').insert(datos);

    const { error } = await operacion;
    if (error) throw new Error(error.message);

    document.dispatchEvent(new CustomEvent('producto:guardado', {
      detail: { esNuevo: !id },
    }));
    await this.cargar();
  }

  async eliminar(productoId) {
    const { error } = await this._supabase.from('productos').delete().eq('id', productoId);
    if (error) throw new Error(error.message);

    document.dispatchEvent(new CustomEvent('producto:eliminado', {
      detail: { productoId },
    }));
    await this.cargar();
  }

  async actualizarStock(productoId, nuevoStock) {
    const { error } = await this._supabase
      .from('productos')
      .update({ stock_disponible: nuevoStock })
      .eq('id', productoId);
    if (error) throw new Error(error.message);
    await this.cargar();
  }
}

export default ModeloProductoAdmin;
