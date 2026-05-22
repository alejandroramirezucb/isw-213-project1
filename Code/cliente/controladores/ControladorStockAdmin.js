class ControladorStockAdmin {
  constructor(modeloProductoAdmin, vistaStock, clienteSupabase) {
    this._modelo = modeloProductoAdmin;
    this._vista = vistaStock;
    this._supabase = clienteSupabase;
    this._bindEventos();
    this._cargarAlertas();
  }

  _bindEventos() {
    document.addEventListener('stock:guardadoSolicitado', async (e) => {
      const { productoId, nuevoStock } = e.detail;
      try {
        await this._modelo.actualizarStock(productoId, nuevoStock);
        if (window.showToast) window.showToast('Stock actualizado', { tipo: 'success' });
        await this._cargarAlertas();
      } catch {
        if (window.showToast) window.showToast('Error al actualizar stock', { tipo: 'error' });
      }
    });

    document.addEventListener('stock:actualizacionSolicitada', () => {
      this._cargarAlertas();
    });
  }

  async _cargarAlertas() {
    const umbral = parseInt(document.getElementById('umbral-stock')?.value, 10) || 5;
    const { data: productos } = await this._supabase
      .from('productos')
      .select('id, nombre, stock_disponible')
      .lte('stock_disponible', umbral)
      .order('stock_disponible', { ascending: true });

    this._vista.renderizarAlertas(productos || [], umbral);
  }
}

export default ControladorStockAdmin;
