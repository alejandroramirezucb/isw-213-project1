class ControladorCarrito {
  static COSTO_DELIVERY = 15;

  constructor(modeloCarrito, modeloPedido, carritoServicio, clienteSupabase) {
    this._modeloCarrito = modeloCarrito;
    this._modeloPedido = modeloPedido;
    this._carritoServicio = carritoServicio;
    this._supabase = clienteSupabase;
    this._bindEventos();
    this._modeloCarrito.obtener();
  }

  _bindEventos() {
    document.addEventListener('carrito:cantidadSolicitada', (e) => {
      const { productoId, cambio, nombre } = e.detail;
      const carrito = this._carritoServicio.obtenerCarrito();
      const item = carrito.find((p) => p.id === productoId);
      if (!item) return;

      const cantidadNueva = item.cantidad + cambio;
      if (cantidadNueva < 1) {
        if (window.showConfirm) {
          window.showConfirm(`¿Deseas eliminar "${nombre}" del carrito?`, { textoConfirmar: 'Eliminar', textoCancelar: 'Cancelar' })
            .then((confirmado) => { if (confirmado) this._modeloCarrito.eliminar(productoId); });
        }
        return;
      }

      const stockActual = item.stock || 999;
      if (cantidadNueva > stockActual) {
        if (window.showToast) window.showToast(`Solo hay ${stockActual} unidades disponibles.`, { tipo: 'warning' });
        return;
      }

      this._modeloCarrito.actualizarCantidad(productoId, cantidadNueva);
    });

    document.addEventListener('carrito:cantidadDirecta', (e) => {
      const { productoId, cantidad } = e.detail;
      const nuevaCantidad = parseInt(cantidad);
      if (isNaN(nuevaCantidad) || nuevaCantidad < 1) {
        if (window.showToast) window.showToast('La cantidad debe ser al menos 1.', { tipo: 'warning' });
        this._modeloCarrito.obtener();
        return;
      }

      const carrito = this._carritoServicio.obtenerCarrito();
      const item = carrito.find((p) => p.id === productoId);
      if (!item) return;

      if (nuevaCantidad > (item.stock || 999)) {
        if (window.showToast) window.showToast(`Solo hay ${item.stock} unidades disponibles.`, { tipo: 'warning' });
        this._modeloCarrito.obtener();
        return;
      }

      this._modeloCarrito.actualizarCantidad(productoId, nuevaCantidad);
    });

    document.addEventListener('carrito:eliminacionSolicitada', (e) => {
      const { productoId, nombre } = e.detail;
      if (window.showConfirm) {
        window.showConfirm(`¿Estás seguro de eliminar "${nombre}" del carrito?`, { textoConfirmar: 'Eliminar', textoCancelar: 'Cancelar' })
          .then((confirmado) => { if (confirmado) this._modeloCarrito.eliminar(productoId); });
      } else {
        this._modeloCarrito.eliminar(productoId);
      }
    });

    document.addEventListener('pago:metodoCambiado', () => {
      this._modeloCarrito.obtener();
    });

    document.addEventListener('pago:formEnviado', (e) => {
      this._finalizarPedido(e.detail.estadoPago);
    });

    const btnFinalizar = document.getElementById('btn-finalizar');
    btnFinalizar?.addEventListener('click', async () => {
      if (!this._supabase) { window.location.href = '/login'; return; }
      const { data } = await this._supabase.auth.getSession();
      if (!data.session) { window.location.href = '/login'; return; }
      this._procesarFinalizacion(data.session.user.id);
    });
  }

  _procesarFinalizacion(usuarioId) {
    const carrito = this._carritoServicio.obtenerCarrito();
    if (!carrito || carrito.length === 0) {
      if (window.showToast) window.showToast('El carrito está vacío.', { tipo: 'info' });
      return;
    }

    const entrega = document.querySelector('input[name="metodo-entrega"]:checked')?.value || 'recojo_almacen';
    const pago = document.querySelector('input[name="metodo-pago"]:checked')?.value || 'efectivo';
    const direccion = document.getElementById('direccion')?.value;
    const costoEnvio = entrega === 'delivery' ? ControladorCarrito.COSTO_DELIVERY : 0;
    const total = this._carritoServicio.obtenerPrecioTotal() + costoEnvio;

    if (entrega === 'delivery' && (!direccion || !direccion.trim())) {
      if (window.showToast) window.showToast('Por favor ingresa la dirección de entrega.', { tipo: 'warning' });
      return;
    }

    if (pago === 'efectivo') {
      this._finalizarPedido('pendiente');
    } else {
      document.dispatchEvent(new CustomEvent('pago:abrirModal', { detail: { total, metodoPago: pago } }));
    }
  }

  async _finalizarPedido(estadoPago) {
    if (!this._supabase) return;
    const { data } = await this._supabase.auth.getSession();
    if (!data.session) return;

    const carrito = this._carritoServicio.obtenerCarrito();
    const precioProductos = this._carritoServicio.obtenerPrecioTotal();
    const entrega = document.querySelector('input[name="metodo-entrega"]:checked')?.value || 'recojo_almacen';
    const pago = document.querySelector('input[name="metodo-pago"]:checked')?.value || 'efectivo';
    const direccion = document.getElementById('direccion')?.value;
    const costoEnvio = entrega === 'delivery' ? ControladorCarrito.COSTO_DELIVERY : 0;
    const total = precioProductos + costoEnvio;

    const payload = {
      usuario_id: data.session.user.id,
      monto_total: total,
      metodo_entrega: entrega,
      direccion_destino: direccion,
      detalles: carrito.map((item) => ({
        producto_id: item.id,
        cantidad: item.cantidad,
        precio_unitario_venta: item.precio,
      })),
      pago: {
        metodo_pago: pago,
        estado_pago: estadoPago,
        es_en_cuotas: false,
        cantidad_cuotas: 1,
        monto_total_pagado: total,
      },
    };

    document.addEventListener('pedido:creado', () => {
      this._modeloCarrito.vaciar();
      if (window.showToast) window.showToast('¡Compra realizada con éxito!', { tipo: 'success' });
      document.getElementById('modal-pago')?.classList.remove('modal-pago--visible');
      setTimeout(() => { window.location.href = '/historial'; }, 1200);
    }, { once: true });

    document.addEventListener('pedido:error', (e) => {
      if (window.showToast) window.showToast(`Error al procesar el pedido: ${e.detail.mensaje}`, { tipo: 'error' });
    }, { once: true });

    await this._modeloPedido.crear(payload);
  }
}

export default ControladorCarrito;
