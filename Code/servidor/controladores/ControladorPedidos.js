const supabase = require('../db');

class ControladorPedidos {
  async crear(req, res) {
    try {
      const { usuario_id, monto_total, metodo_entrega, direccion_destino, detalles, pago } = req.body || {};
      if (!usuario_id || !Array.isArray(detalles) || detalles.length === 0) {
        return res.status(400).json({ error: 'usuario_id y detalles[] son requeridos' });
      }

      const { data: pedidoData, error: errorPedido } = await supabase
        .from('pedidos')
        .insert({ usuario_id, monto_total: monto_total || 0, metodo_entrega: metodo_entrega || 'recojo_almacen', direccion_destino: direccion_destino || null, estado: 'orden realizada' })
        .select().single();

      if (errorPedido) return res.status(500).json({ error: errorPedido.message });

      const pedidoId = pedidoData.id;
      const { data: detallesData, error: errorDetalles } = await supabase
        .from('detalles_pedido')
        .insert(detalles.map((d) => ({ pedido_id: pedidoId, producto_id: d.producto_id, cantidad: d.cantidad, precio_unitario_venta: d.precio_unitario_venta })))
        .select();

      if (errorDetalles) {
        await supabase.from('pedidos').delete().eq('id', pedidoId);
        return res.status(500).json({ error: errorDetalles.message });
      }

      let pagoData = null;
      if (pago && typeof pago === 'object') {
        const { data: pagoInsertado, error: errorPago } = await supabase
          .from('pagos')
          .insert({ pedido_id: pedidoId, metodo_pago: pago.metodo_pago || 'efectivo', estado_pago: pago.estado_pago || 'pendiente', es_en_cuotas: !!pago.es_en_cuotas, cantidad_cuotas: pago.cantidad_cuotas || 1, referencia_transaccion: pago.referencia_transaccion || null, monto_total_pagado: pago.monto_total_pagado || monto_total || 0 })
          .select();

        if (errorPago) {
          await supabase.from('detalles_pedido').delete().eq('pedido_id', pedidoId);
          await supabase.from('pedidos').delete().eq('id', pedidoId);
          return res.status(500).json({ error: errorPago.message });
        }
        pagoData = pagoInsertado[0];
      }

      await supabase.from('historial_estados_pedido').insert({ pedido_id: pedidoId, estado: 'orden realizada' });
      return res.json({ pedido: pedidoData, detalles: detallesData, pago: pagoData });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async obtenerAdmin(req, res) {
    try {
      const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select('id, usuario_id, monto_total, estado, metodo_entrega, direccion_destino, fecha_creacion, fecha_entrega_final, confirmacion_cliente')
        .order('fecha_creacion', { ascending: false });

      if (error) return res.status(500).json({ error: error.message });
      if (!pedidos || pedidos.length === 0) return res.json({ pedidos: [] });

      const usuarioIds = pedidos.map((p) => p.usuario_id);
      const { data: usuarios } = await supabase.from('usuarios').select('id, nombre_completo, correo_electronico').in('id', usuarioIds);

      const mapaUsuarios = Object.fromEntries((usuarios || []).map((u) => [u.id, u]));
      const pedidosEnriquecidos = pedidos.map((pedido) => {
        const usuario = mapaUsuarios[pedido.usuario_id] || {};
        return { ...pedido, nombre_cliente: usuario.nombre_completo || 'Desconocido', correo_cliente: usuario.correo_electronico || '' };
      });

      return res.json({ pedidos: pedidosEnriquecidos });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async obtenerHistorialEstados(req, res) {
    try {
      const { pedidoId } = req.params;
      const { data, error } = await supabase.from('historial_estados_pedido').select('estado, fecha_cambio').eq('pedido_id', pedidoId).order('fecha_cambio', { ascending: true });
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ historial: data });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async avanzarEstado(req, res) {
    try {
      const { pedidoId } = req.params;
      const { estado } = req.body;
      if (!estado) return res.status(400).json({ error: 'estado es requerido' });

      const updateData = { estado };
      if (estado === 'entregado') updateData.fecha_entrega_final = new Date().toISOString();

      const { data, error } = await supabase.from('pedidos').update(updateData).eq('id', pedidoId).select();
      if (error) return res.status(500).json({ error: error.message });

      await supabase.from('historial_estados_pedido').insert({ pedido_id: pedidoId, estado });
      return res.json({ pedido: data[0] });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async confirmarRecepcion(req, res) {
    try {
      const { pedidoId } = req.params;
      const { data: pedidoActual } = await supabase.from('pedidos').select('estado, confirmacion_cliente').eq('id', pedidoId).single();

      if (!pedidoActual || pedidoActual.estado !== 'entregado') return res.status(400).json({ error: 'El pedido debe estar en estado entregado' });
      if (pedidoActual.confirmacion_cliente) return res.status(400).json({ error: 'El pedido ya fue confirmado' });

      const { data, error } = await supabase.from('pedidos').update({ estado: 'cerrado', confirmacion_cliente: true }).eq('id', pedidoId).select();
      if (error) return res.status(500).json({ error: error.message });

      await supabase.from('historial_estados_pedido').insert({ pedido_id: pedidoId, estado: 'cerrado' });
      return res.json({ pedido: data[0] });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
}

module.exports = ControladorPedidos;
