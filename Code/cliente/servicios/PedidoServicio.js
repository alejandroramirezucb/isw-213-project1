class PedidoServicio {
  async crear(payload) {
    const respuesta = await fetch('/api/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await respuesta.json();
    if (!respuesta.ok) throw new Error(json.error || respuesta.statusText);
    return json;
  }

  async obtenerAdmin() {
    const respuesta = await fetch('/api/pedidos/admin');
    const json = await respuesta.json();
    if (!respuesta.ok) throw new Error(json.error || respuesta.statusText);
    return json.pedidos || [];
  }

  async avanzarEstado(pedidoId, estado) {
    const respuesta = await fetch(`/api/pedidos/${pedidoId}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    });
    const json = await respuesta.json();
    if (!respuesta.ok || json.error) throw new Error(json.error || respuesta.statusText);
    return json;
  }

  async confirmarRecepcion(pedidoId) {
    const respuesta = await fetch(`/api/pedidos/${pedidoId}/confirmar-recepcion`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await respuesta.json();
    if (!respuesta.ok || json.error) throw new Error(json.error || respuesta.statusText);
    return json;
  }

  async obtenerHistorialUsuario(supabase, usuarioId) {
    const { data: pedidos, error } = await supabase
      .from('pedidos')
      .select(
        'id, monto_total, estado, fecha_creacion, direccion_destino, metodo_entrega, confirmacion_cliente, fecha_entrega_final',
      )
      .eq('usuario_id', usuarioId)
      .order('fecha_creacion', { ascending: false });

    if (error) throw new Error(error.message);
    if (!pedidos || pedidos.length === 0) return [];

    const pedidoIds = pedidos.map((p) => p.id);
    const [resDetalles, resHistorial, resDevoluciones] = await Promise.all([
      supabase
        .from('detalles_pedido')
        .select('id, pedido_id, cantidad, precio_unitario_venta, producto_id')
        .in('pedido_id', pedidoIds),
      supabase
        .from('historial_estados_pedido')
        .select('pedido_id, estado, fecha_cambio')
        .in('pedido_id', pedidoIds)
        .order('fecha_cambio', { ascending: true }),
      supabase
        .from('devoluciones')
        .select('id, pedido_id, motivo_devolucion, estado_devolucion, fecha_solicitud')
        .in('pedido_id', pedidoIds),
    ]);

    const detalles = resDetalles.data || [];
    const historialEstados = resHistorial.data || [];
    const devoluciones = resDevoluciones.data || [];

    return pedidos.map((pedido) => ({
      ...pedido,
      detalles: detalles.filter((d) => d.pedido_id === pedido.id),
      historial_estados: historialEstados.filter((h) => h.pedido_id === pedido.id),
      devolucion: devoluciones.find((d) => d.pedido_id === pedido.id) || null,
    }));
  }
}

export default PedidoServicio;
