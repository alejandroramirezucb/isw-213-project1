const supabase = require('../db');

class ControladorDevoluciones {
  async obtenerTodas(req, res) {
    try {
      const { data, error } = await supabase
        .from('devoluciones')
        .select('id, pedido_id, motivo_devolucion, foto_factura_url, estado_devolucion, fecha_solicitud, observaciones_admin')
        .order('fecha_solicitud', { ascending: false });

      if (error) return res.status(500).json({ error: error.message });
      if (!data || data.length === 0) return res.json({ devoluciones: [] });

      const pedidoIds = data.map((d) => d.pedido_id);
      const { data: pedidos } = await supabase.from('pedidos').select('id, usuario_id, monto_total').in('id', pedidoIds);
      const usuarioIds = (pedidos || []).map((p) => p.usuario_id);
      const { data: usuarios } = await supabase.from('usuarios').select('id, nombre_completo, correo_electronico').in('id', usuarioIds);

      const mapaPedidos = Object.fromEntries((pedidos || []).map((p) => [p.id, p]));
      const mapaUsuarios = Object.fromEntries((usuarios || []).map((u) => [u.id, u]));

      const devoluciones = data.map((d) => {
        const pedido = mapaPedidos[d.pedido_id] || {};
        const usuario = mapaUsuarios[pedido.usuario_id] || {};
        return { ...d, monto_total: pedido.monto_total || 0, nombre_cliente: usuario.nombre_completo || 'Desconocido', correo_cliente: usuario.correo_electronico || '' };
      });

      return res.json({ devoluciones });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async crear(req, res) {
    try {
      const { pedido_id, motivo_devolucion, foto_factura_url } = req.body;
      if (!pedido_id || !motivo_devolucion || !foto_factura_url) {
        return res.status(400).json({ error: 'pedido_id, motivo_devolucion y foto_factura_url son requeridos' });
      }

      const { data: pedido } = await supabase.from('pedidos').select('estado, fecha_entrega_final').eq('id', pedido_id).single();
      if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });

      if (!['entregado', 'cerrado'].includes(pedido.estado)) return res.status(400).json({ error: 'Solo se pueden devolver pedidos entregados o cerrados' });

      if (pedido.fecha_entrega_final) {
        const diferencia = Date.now() - new Date(pedido.fecha_entrega_final).getTime();
        if (diferencia > 24 * 60 * 60 * 1000) return res.status(400).json({ error: 'El plazo de 24 horas para solicitar devolucion ha vencido' });
      }

      const { data: existente } = await supabase.from('devoluciones').select('id').eq('pedido_id', pedido_id).single();
      if (existente) return res.status(400).json({ error: 'Ya existe una solicitud de devolucion para este pedido' });

      const { data, error } = await supabase.from('devoluciones').insert({ pedido_id, motivo_devolucion, foto_factura_url, estado_devolucion: 'pendiente' }).select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ devolucion: data });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async aprobar(req, res) {
    try {
      const { devolucionId } = req.params;
      const { observaciones_admin } = req.body;

      const { data: devolucion } = await supabase.from('devoluciones').select('id, pedido_id, estado_devolucion').eq('id', devolucionId).single();
      if (!devolucion) return res.status(404).json({ error: 'Devolucion no encontrada' });
      if (devolucion.estado_devolucion !== 'pendiente') return res.status(400).json({ error: 'Esta devolucion ya fue procesada' });

      const { data: detallesPedido } = await supabase.from('detalles_pedido').select('producto_id, cantidad').eq('pedido_id', devolucion.pedido_id);
      if (detallesPedido) {
        for (const detalle of detallesPedido) {
          const { data: producto } = await supabase.from('productos').select('stock_disponible').eq('id', detalle.producto_id).single();
          if (producto) {
            await supabase.from('productos').update({ stock_disponible: (producto.stock_disponible || 0) + detalle.cantidad }).eq('id', detalle.producto_id);
          }
        }
      }

      const { data, error } = await supabase.from('devoluciones').update({ estado_devolucion: 'aprobada', observaciones_admin: observaciones_admin || 'Devolucion aprobada' }).eq('id', devolucionId).select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ devolucion: data });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async rechazar(req, res) {
    try {
      const { devolucionId } = req.params;
      const { observaciones_admin } = req.body;

      const { data: devolucion } = await supabase.from('devoluciones').select('id, estado_devolucion').eq('id', devolucionId).single();
      if (!devolucion) return res.status(404).json({ error: 'Devolucion no encontrada' });
      if (devolucion.estado_devolucion !== 'pendiente') return res.status(400).json({ error: 'Esta devolucion ya fue procesada' });

      const { data, error } = await supabase.from('devoluciones').update({ estado_devolucion: 'rechazada', observaciones_admin: observaciones_admin || 'Devolucion rechazada' }).eq('id', devolucionId).select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ devolucion: data });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
}

module.exports = ControladorDevoluciones;
