class ControladorCatalogAdmin {
  constructor(modeloProductoAdmin, vistaCatalogo) {
    this._modelo = modeloProductoAdmin;
    this._vista = vistaCatalogo;
    this._bindEventos();
    this._modelo.cargar();
  }

  _bindEventos() {
    document.addEventListener('catalogo:nuevoSolicitado', () => {
      this._vista.abrirModalNuevo();
    });

    document.addEventListener('catalogo:editarSolicitado', (e) => {
      this._vista.abrirModalEdicion(e.detail.producto);
    });

    document.addEventListener('catalogo:eliminarSolicitado', async (e) => {
      const { productoId, nombreProducto } = e.detail;
      if (!confirm(`¿Estás seguro de eliminar "${nombreProducto}"?`)) return;
      try {
        await this._modelo.eliminar(productoId);
        if (window.showToast) window.showToast('Producto eliminado', { tipo: 'success' });
      } catch (err) {
        if (window.showToast) window.showToast(`Error al eliminar: ${err.message}`, { tipo: 'error' });
      }
    });

    const formulario = document.getElementById('form-producto');
    formulario?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const { id, datos } = this._vista.obtenerDatosFormulario();
      try {
        await this._modelo.guardar(datos, id);
        this._vista.cerrarModal();
        if (window.showToast) window.showToast(id ? 'Producto actualizado' : 'Producto creado', { tipo: 'success' });
      } catch (err) {
        if (window.showToast) window.showToast(`Error al guardar: ${err.message}`, { tipo: 'error' });
      }
    });

    const btnCerrar = document.getElementById('btn-cerrar-modal');
    const btnCancelar = document.getElementById('btn-cancelar-modal');
    const modal = document.getElementById('modal-producto');

    btnCerrar?.addEventListener('click', () => this._vista.cerrarModal());
    btnCancelar?.addEventListener('click', () => this._vista.cerrarModal());
    modal?.addEventListener('click', (e) => { if (e.target === modal) this._vista.cerrarModal(); });
  }
}

export default ControladorCatalogAdmin;
