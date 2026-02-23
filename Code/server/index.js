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
        estado: 'recibido',
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

aplicacion.get('/historial', (peticion, respuesta) => {
  respuesta.sendFile(ruta.join(__dirname, '..', 'html', 'historial.html'));
});

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
