require('dotenv').config();
const express = require('express');
const ruta = require('path');
const { validarConfiguracion, mapearProducto } = require('./utils');
const RepositorioProductos = require('./repositorios/RepositorioProductos');
const ServicioProductos = require('./servicios/ServicioProductos');
const ControladorProductos = require('./controladores/ControladorProductos');

if (!validarConfiguracion()) {
  process.exit(1);
}

const aplicacion = express();
const repositorioProductos = new RepositorioProductos();
const servicioProductos = new ServicioProductos(repositorioProductos, {
  mapear: mapearProducto,
});
const controladorProductos = new ControladorProductos(servicioProductos);

aplicacion.use(express.static(ruta.join(__dirname, '..')));
aplicacion.use(express.json());

aplicacion.get('/config', (peticion, respuesta) => {
  respuesta.json({
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_ANON_KEY,
  });
});

aplicacion.get('/api/navbar', (peticion, respuesta) => {
  respuesta.sendFile(ruta.join(__dirname, '..', 'html', 'navbar.html'));
});

aplicacion.get('/api/producto-tarjeta', (peticion, respuesta) => {
  respuesta.sendFile(
    ruta.join(__dirname, '..', 'html', 'producto-tarjeta.html'),
  );
});

aplicacion.get('/api/productos', (peticion, respuesta) =>
  controladorProductos.obtenerTodos(peticion, respuesta),
);

aplicacion.post('/api/usuarios/fallback', async (req, res) => {
  try {
    const { id, nombre_completo, correo_electronico, telefono, rol } = req.body;

    if (!id || !correo_electronico) {
      return res.status(400).json({ error: 'ID y correo son obligatorios' });
    }

    const supabase = require('./db');

    const { data, error } = await supabase
      .from('usuarios')
      .upsert(
        {
          id,
          nombre_completo: nombre_completo || 'Usuario Nuevo',
          correo_electronico,
          telefono: telefono || null,
          rol: rol || 'cliente',
        },
        { onConflict: 'id' },
      )
      .select();

    if (error) {
      if (error.code === '42501') {
        return res.status(500).json({
          error:
            'RLS bloqueó el INSERT. Configura SUPABASE_SERVICE_ROLE_KEY en tu .env',
        });
      }
      if (error.code === '23503') {
        return res.status(500).json({
          error:
            'El usuario aún no existe en auth.users. Espera un momento e intenta de nuevo.',
        });
      }
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true, message: 'Usuario sincronizado' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

aplicacion.post('/api/productos/stock-batch', async (peticion, respuesta) => {
  try {
    const ids =
      peticion.body && Array.isArray(peticion.body.ids)
        ? peticion.body.ids
        : [];

    if (!ids.length) {
      return respuesta
        .status(400)
        .json({ error: 'Se requiere un arreglo de ids' });
    }

    const supabase = require('./db');
    const { data, error } = await supabase
      .from('productos')
      .select('id, stock_disponible')
      .in('id', ids);

    if (error) return respuesta.status(500).json({ error: error.message });
    return respuesta.json({ stocks: data });
  } catch (err) {
    return respuesta.status(500).json({ error: err.message });
  }
});

aplicacion.post('/api/pedidos', async (req, res) => {
  try {
    const {
      usuario_id,
      monto_total,
      metodo_entrega,
      direccion_destino,
      detalles,
      pago,
    } = req.body || {};

    if (!usuario_id || !Array.isArray(detalles) || detalles.length === 0) {
      return res
        .status(400)
        .json({ error: 'usuario_id y detalles[] son requeridos' });
    }

    const supabase = require('./db');

    const { data: pedidoData, error: errorPedido } = await supabase
      .from('pedidos')
      .insert({
        usuario_id,
        monto_total: monto_total || 0,
        metodo_entrega: metodo_entrega || 'recojo_almacen',
        direccion_destino: direccion_destino || null,
        estado: 'orden realizada',
      })
      .select()
      .single();

    if (errorPedido) {
      return res.status(500).json({ error: errorPedido.message });
    }

    const pedidoId = pedidoData.id;

    const detallesParaInsertar = detalles.map((detalle) => ({
      pedido_id: pedidoId,
      producto_id: detalle.producto_id,
      cantidad: detalle.cantidad,
      precio_unitario_venta: detalle.precio_unitario_venta,
    }));

    const { data: detallesData, error: errorDetalles } = await supabase
      .from('detalles_pedido')
      .insert(detallesParaInsertar)
      .select();

    if (errorDetalles) {
      await supabase.from('pedidos').delete().eq('id', pedidoId);
      return res.status(500).json({ error: errorDetalles.message });
    }

    let pagoData = null;
    if (pago && typeof pago === 'object') {
      const pagoParaInsertar = {
        pedido_id: pedidoId,
        metodo_pago: pago.metodo_pago || 'efectivo',
        estado_pago: pago.estado_pago || 'pendiente',
        es_en_cuotas: !!pago.es_en_cuotas,
        cantidad_cuotas: pago.cantidad_cuotas || 1,
        referencia_transaccion: pago.referencia_transaccion || null,
        monto_total_pagado: pago.monto_total_pagado || monto_total || 0,
      };

      const { data: pagoInsertado, error: errorPago } = await supabase
        .from('pagos')
        .insert(pagoParaInsertar)
        .select();

      if (errorPago) {
        await supabase
          .from('detalles_pedido')
          .delete()
          .in('pedido_id', [pedidoId]);
        await supabase.from('pedidos').delete().eq('id', pedidoId);
        return res.status(500).json({ error: errorPago.message });
      }
      pagoData = pagoInsertado[0];
    }

    await supabase
      .from('historial_estados_pedido')
      .insert({
        pedido_id: pedidoId,
        estado: 'orden realizada',
      })
      .then(function () {})
      .catch(function () {});

    return res.json({
      pedido: pedidoData,
      detalles: detallesData,
      pago: pagoData,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

aplicacion.get('/api/productos/:id', (peticion, respuesta) =>
  controladorProductos.obtenerPorId(peticion, respuesta),
);

aplicacion.get('/api/productos/:id/stock', (peticion, respuesta) =>
  controladorProductos.verificarStock(peticion, respuesta),
);

aplicacion.get('/producto/:id', (peticion, respuesta) => {
  respuesta.sendFile(
    ruta.join(__dirname, '..', 'html', 'producto-detalle.html'),
  );
});

aplicacion.get('/carrito', (peticion, respuesta) => {
  respuesta.sendFile(ruta.join(__dirname, '..', 'html', 'carrito.html'));
});

aplicacion.get('/login', (peticion, respuesta) => {
  respuesta.sendFile(ruta.join(__dirname, '..', 'html', 'login.html'));
});

aplicacion.get('/register', (peticion, respuesta) => {
  respuesta.sendFile(ruta.join(__dirname, '..', 'html', 'register.html'));
});

aplicacion.get('/perfil', (peticion, respuesta) => {
  respuesta.sendFile(ruta.join(__dirname, '..', 'html', 'perfil.html'));
});

aplicacion.get('/admin', (peticion, respuesta) => {
  respuesta.sendFile(ruta.join(__dirname, '..', 'html', 'admin.html'));
});

aplicacion.get('/chofer', (peticion, respuesta) => {
  respuesta.sendFile(ruta.join(__dirname, '..', 'html', 'chofer.html'));
});

aplicacion.post('/api/envios/ubicacion', async (req, res) => {
  try {
    const { envio_id, latitud, longitud } = req.body;
    if (!envio_id || latitud === undefined || longitud === undefined) {
      return res
        .status(400)
        .json({ error: 'envio_id, latitud y longitud son requeridos' });
    }
    const supabase = require('./db');
    const { data, error } = await supabase
      .from('historial_ubicaciones')
      .insert({ envio_id, latitud, longitud })
      .select();
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ubicacion: data[0] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

aplicacion.patch('/api/envios/:envioId/evidencia', async (req, res) => {
  try {
    const { envioId } = req.params;
    const { foto_evidencia_url } = req.body;
    if (!foto_evidencia_url) {
      return res.status(400).json({ error: 'foto_evidencia_url es requerido' });
    }
    const supabase = require('./db');
    const { data, error } = await supabase
      .from('envios')
      .update({ foto_evidencia_url })
      .eq('id', envioId)
      .select();
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ envio: data[0] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

aplicacion.patch('/api/pedidos/:pedidoId/estado', async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const { estado } = req.body;
    if (!estado) {
      return res.status(400).json({ error: 'estado es requerido' });
    }
    const supabase = require('./db');
    var updateData = { estado };
    if (estado === 'entregado') {
      updateData.fecha_entrega_final = new Date().toISOString();
    }
    const { data, error } = await supabase
      .from('pedidos')
      .update(updateData)
      .eq('id', pedidoId)
      .select();
    if (error) return res.status(500).json({ error: error.message });

    await supabase
      .from('historial_estados_pedido')
      .insert({
        pedido_id: pedidoId,
        estado,
      })
      .then(function () {})
      .catch(function () {});

    return res.json({ pedido: data[0] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

aplicacion.patch(
  '/api/pedidos/:pedidoId/confirmar-recepcion',
  async (req, res) => {
    try {
      const { pedidoId } = req.params;
      const supabase = require('./db');

      const { data: pedidoActual } = await supabase
        .from('pedidos')
        .select('estado, confirmacion_cliente')
        .eq('id', pedidoId)
        .single();

      if (!pedidoActual || pedidoActual.estado !== 'entregado') {
        return res
          .status(400)
          .json({ error: 'El pedido debe estar en estado entregado' });
      }

      if (pedidoActual.confirmacion_cliente) {
        return res.status(400).json({ error: 'El pedido ya fue confirmado' });
      }

      const { data, error } = await supabase
        .from('pedidos')
        .update({ estado: 'cerrado', confirmacion_cliente: true })
        .eq('id', pedidoId)
        .select();

      if (error) return res.status(500).json({ error: error.message });

      await supabase
        .from('historial_estados_pedido')
        .insert({
          pedido_id: pedidoId,
          estado: 'cerrado',
        })
        .then(function () {})
        .catch(function () {});

      return res.json({ pedido: data[0] });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },
);

aplicacion.get('/api/pedidos/:pedidoId/historial-estados', async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const supabase = require('./db');
    const { data, error } = await supabase
      .from('historial_estados_pedido')
      .select('estado, fecha_cambio')
      .eq('pedido_id', pedidoId)
      .order('fecha_cambio', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ historial: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

aplicacion.get('/api/choferes', async (req, res) => {
  try {
    const supabase = require('./db');
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre_completo')
      .eq('rol', 'chofer')
      .order('nombre_completo');
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ choferes: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

aplicacion.get('/historial', (peticion, respuesta) => {
  respuesta.sendFile(ruta.join(__dirname, '..', 'html', 'historial.html'));
});

aplicacion.get('/ayuda', (peticion, respuesta) => {
  respuesta.sendFile(ruta.join(__dirname, '..', 'html', 'ayuda.html'));
});

aplicacion.get('/api/pedidos/admin', async (req, res) => {
  try {
    const supabase = require('./db');

    const { data: pedidos, error } = await supabase
      .from('pedidos')
      .select(
        'id, usuario_id, monto_total, estado, metodo_entrega, direccion_destino, fecha_creacion, fecha_entrega_final, confirmacion_cliente',
      )
      .order('fecha_creacion', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    if (!pedidos || pedidos.length === 0) {
      return res.json({ pedidos: [] });
    }

    var usuarioIds = pedidos.map(function (p) {
      return p.usuario_id;
    });

    const { data: usuarios } = await supabase
      .from('usuarios')
      .select('id, nombre_completo, correo_electronico')
      .in('id', usuarioIds);

    var mapaUsuarios = {};
    (usuarios || []).forEach(function (u) {
      mapaUsuarios[u.id] = u;
    });

    var pedidosEnriquecidos = pedidos.map(function (pedido) {
      var usuario = mapaUsuarios[pedido.usuario_id] || {};
      return {
        id: pedido.id,
        monto_total: pedido.monto_total,
        estado: pedido.estado,
        metodo_entrega: pedido.metodo_entrega,
        direccion_destino: pedido.direccion_destino,
        fecha_creacion: pedido.fecha_creacion,
        fecha_entrega_final: pedido.fecha_entrega_final,
        confirmacion_cliente: pedido.confirmacion_cliente,
        nombre_cliente: usuario.nombre_completo || 'Desconocido',
        correo_cliente: usuario.correo_electronico || '',
      };
    });

    return res.json({ pedidos: pedidosEnriquecidos });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

aplicacion.post('/api/devoluciones', async (req, res) => {
  try {
    const { pedido_id, motivo_devolucion, foto_factura_url } = req.body;

    if (!pedido_id || !motivo_devolucion || !foto_factura_url) {
      return res.status(400).json({
        error: 'pedido_id, motivo_devolucion y foto_factura_url son requeridos',
      });
    }

    const supabase = require('./db');

    const { data: pedido } = await supabase
      .from('pedidos')
      .select('estado, fecha_entrega_final')
      .eq('id', pedido_id)
      .single();

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    var estadosPermitidos = ['entregado', 'cerrado'];
    if (estadosPermitidos.indexOf(pedido.estado) === -1) {
      return res.status(400).json({
        error: 'Solo se pueden devolver pedidos entregados o cerrados',
      });
    }

    if (pedido.fecha_entrega_final) {
      var milisegundosEn24Horas = 24 * 60 * 60 * 1000;
      var diferencia =
        new Date().getTime() - new Date(pedido.fecha_entrega_final).getTime();
      if (diferencia > milisegundosEn24Horas) {
        return res.status(400).json({
          error: 'El plazo de 24 horas para solicitar devolucion ha vencido',
        });
      }
    }

    const { data: devolucionExistente } = await supabase
      .from('devoluciones')
      .select('id')
      .eq('pedido_id', pedido_id)
      .single();

    if (devolucionExistente) {
      return res.status(400).json({
        error: 'Ya existe una solicitud de devolucion para este pedido',
      });
    }

    const { data, error } = await supabase
      .from('devoluciones')
      .insert({
        pedido_id,
        motivo_devolucion,
        foto_factura_url,
        estado_devolucion: 'pendiente',
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ devolucion: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

aplicacion.post('/api/mensajes-ayuda', async (req, res) => {
  try {
    const { usuario_id, nombre, email, categoria, mensaje } = req.body || {};

    if (!nombre || !email || !categoria || !mensaje) {
      return res.status(400).json({
        error: 'nombre, email, categoria y mensaje son requeridos',
      });
    }

    const supabase = require('./db');
    const { data, error } = await supabase
      .from('mensajes_ayuda')
      .insert({
        usuario_id: usuario_id || null,
        nombre,
        email,
        categoria,
        mensaje,
        estado: 'pendiente',
      })
      .select();

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ mensaje: data[0] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

aplicacion.get('/api/mensajes-ayuda', async (req, res) => {
  try {
    const supabase = require('./db');
    const { data, error } = await supabase
      .from('mensajes_ayuda')
      .select('*')
      .order('fecha_creacion', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ mensajes: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

aplicacion.patch('/api/mensajes-ayuda/:id/responder', async (req, res) => {
  try {
    const { id } = req.params;
    const { respuesta_admin } = req.body;
    if (!respuesta_admin) {
      return res.status(400).json({ error: 'respuesta_admin es requerido' });
    }
    const supabase = require('./db');
    const { data: mensaje } = await supabase
      .from('mensajes_ayuda')
      .select('id, estado')
      .eq('id', id)
      .single();
    if (!mensaje) {
      return res.status(404).json({ error: 'Mensaje no encontrado' });
    }
    if (mensaje.estado === 'respondido') {
      return res.status(400).json({ error: 'El mensaje ya fue respondido' });
    }
    const { data, error } = await supabase
      .from('mensajes_ayuda')
      .update({
        estado: 'respondido',
        respuesta_admin,
        fecha_respuesta: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ mensaje: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

aplicacion.get('/api/devoluciones', async (req, res) => {
  try {
    const supabase = require('./db');
    const { data, error } = await supabase
      .from('devoluciones')
      .select(
        'id, pedido_id, motivo_devolucion, foto_factura_url, estado_devolucion, fecha_solicitud, observaciones_admin',
      )
      .order('fecha_solicitud', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    var pedidoIds = data.map(function (d) {
      return d.pedido_id;
    });

    if (pedidoIds.length === 0) {
      return res.json({ devoluciones: [] });
    }

    const { data: pedidos } = await supabase
      .from('pedidos')
      .select('id, usuario_id, monto_total')
      .in('id', pedidoIds);

    var usuarioIds = (pedidos || []).map(function (p) {
      return p.usuario_id;
    });

    const { data: usuarios } = await supabase
      .from('usuarios')
      .select('id, nombre_completo, correo_electronico')
      .in('id', usuarioIds);

    var mapaPedidos = {};
    (pedidos || []).forEach(function (p) {
      mapaPedidos[p.id] = p;
    });

    var mapaUsuarios = {};
    (usuarios || []).forEach(function (u) {
      mapaUsuarios[u.id] = u;
    });

    var devolucionesEnriquecidas = data.map(function (devolucion) {
      var pedido = mapaPedidos[devolucion.pedido_id] || {};
      var usuario = mapaUsuarios[pedido.usuario_id] || {};
      return {
        id: devolucion.id,
        pedido_id: devolucion.pedido_id,
        motivo_devolucion: devolucion.motivo_devolucion,
        foto_factura_url: devolucion.foto_factura_url,
        estado_devolucion: devolucion.estado_devolucion,
        fecha_solicitud: devolucion.fecha_solicitud,
        observaciones_admin: devolucion.observaciones_admin,
        monto_total: pedido.monto_total || 0,
        nombre_cliente: usuario.nombre_completo || 'Desconocido',
        correo_cliente: usuario.correo_electronico || '',
      };
    });

    return res.json({ devoluciones: devolucionesEnriquecidas });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

aplicacion.patch(
  '/api/devoluciones/:devolucionId/aprobar',
  async (req, res) => {
    try {
      const { devolucionId } = req.params;
      const { observaciones_admin } = req.body;
      const supabase = require('./db');

      const { data: devolucion } = await supabase
        .from('devoluciones')
        .select('id, pedido_id, estado_devolucion')
        .eq('id', devolucionId)
        .single();

      if (!devolucion) {
        return res.status(404).json({ error: 'Devolucion no encontrada' });
      }

      if (devolucion.estado_devolucion !== 'pendiente') {
        return res
          .status(400)
          .json({ error: 'Esta devolucion ya fue procesada' });
      }

      const { data: detallesPedido } = await supabase
        .from('detalles_pedido')
        .select('producto_id, cantidad')
        .eq('pedido_id', devolucion.pedido_id);

      if (detallesPedido && detallesPedido.length > 0) {
        for (var i = 0; i < detallesPedido.length; i++) {
          var detalle = detallesPedido[i];
          const { data: productoActual } = await supabase
            .from('productos')
            .select('stock_disponible')
            .eq('id', detalle.producto_id)
            .single();

          if (productoActual) {
            var nuevoStock =
              (productoActual.stock_disponible || 0) + detalle.cantidad;
            await supabase
              .from('productos')
              .update({ stock_disponible: nuevoStock })
              .eq('id', detalle.producto_id);
          }
        }
      }

      const { data, error } = await supabase
        .from('devoluciones')
        .update({
          estado_devolucion: 'aprobada',
          observaciones_admin: observaciones_admin || 'Devolucion aprobada',
        })
        .eq('id', devolucionId)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.json({ devolucion: data });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },
);

aplicacion.patch(
  '/api/devoluciones/:devolucionId/rechazar',
  async (req, res) => {
    try {
      const { devolucionId } = req.params;
      const { observaciones_admin } = req.body;
      const supabase = require('./db');

      const { data: devolucion } = await supabase
        .from('devoluciones')
        .select('id, estado_devolucion')
        .eq('id', devolucionId)
        .single();

      if (!devolucion) {
        return res.status(404).json({ error: 'Devolucion no encontrada' });
      }

      if (devolucion.estado_devolucion !== 'pendiente') {
        return res
          .status(400)
          .json({ error: 'Esta devolucion ya fue procesada' });
      }

      const { data, error } = await supabase
        .from('devoluciones')
        .update({
          estado_devolucion: 'rechazada',
          observaciones_admin: observaciones_admin || 'Devolucion rechazada',
        })
        .eq('id', devolucionId)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.json({ devolucion: data });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },
);

aplicacion.get('/user', (peticion, respuesta) => {
  respuesta.sendFile(ruta.join(__dirname, '..', 'html', 'perfil.html'));
});

aplicacion.get('/', (peticion, respuesta) => {
  respuesta.sendFile(ruta.join(__dirname, '..', 'html', 'index.html'));
});

aplicacion.use((peticion, respuesta) => {
  respuesta.sendFile(ruta.join(__dirname, '..', 'html', 'index.html'));
});

const puerto = process.env.PORT || 3000;
aplicacion.listen(puerto, () => {
  console.log('Servidor iniciado en puerto ' + puerto);
});
