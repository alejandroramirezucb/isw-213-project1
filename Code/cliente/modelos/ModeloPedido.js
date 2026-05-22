class ModeloPedido {
  constructor(pedidoServicio, carritoServicio) {
    this._pedidoServicio = pedidoServicio;
    this._carritoServicio = carritoServicio;
  }

  async crear(datos) {
    try {
      const json = await this._pedidoServicio.crear(datos);
      document.dispatchEvent(new CustomEvent('pedido:creado', {
        detail: { pedidoId: json.id, estado: json.estado, metodoPago: datos.pago?.metodo_pago },
      }));
    } catch (error) {
      document.dispatchEvent(new CustomEvent('pedido:error', {
        detail: { mensaje: error.message },
      }));
    }
  }

  async cargarAdmin() {
    const pedidos = await this._pedidoServicio.obtenerAdmin();
    document.dispatchEvent(new CustomEvent('pedido:listaCargada', {
      detail: { pedidos },
    }));
  }

  async cargarHistorialUsuario(supabase, usuarioId) {
    try {
      const pedidos = await this._pedidoServicio.obtenerHistorialUsuario(supabase, usuarioId);
      document.dispatchEvent(new CustomEvent('pedido:historialCargado', {
        detail: { pedidos },
      }));
    } catch {
      document.dispatchEvent(new CustomEvent('pedido:historialCargado', {
        detail: { pedidos: [] },
      }));
    }
  }

  async avanzarEstado(pedidoId, estado) {
    await this._pedidoServicio.avanzarEstado(pedidoId, estado);
    document.dispatchEvent(new CustomEvent('pedido:estadoCambiado', {
      detail: { pedidoId, estadoNuevo: estado },
    }));
  }
}

export default ModeloPedido;
