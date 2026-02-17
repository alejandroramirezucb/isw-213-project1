require('dotenv').config();
const express = require('express');
const ruta = require('path');
const { validarConfiguracion, mapearProducto } = require('./utils');
const RepositorioProductos = require('./repositorios/RepositorioProductos');
const ServicioProductos = require('./servicios/ServicioProductos');
const ControladorProductos = require('./controladores/ControladorProductos');

if (!validarConfiguracion()) {
  console.error('Error: Configuración incompleta. Revisa tu archivo .env');
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
  const rutaNavbar = ruta.join(__dirname, '..', 'html', 'navbar.html');
  respuesta.sendFile(rutaNavbar);
});

aplicacion.get('/api/producto-tarjeta', (peticion, respuesta) => {
  const rutaTarjeta = ruta.join(
    __dirname,
    '..',
    'html',
    'producto-tarjeta.html',
  );
  respuesta.sendFile(rutaTarjeta);
});

aplicacion.get('/api/productos', (peticion, respuesta) =>
  controladorProductos.obtenerTodos(peticion, respuesta),
);

aplicacion.post('/api/usuarios/fallback', express.json(), async (req, res) => {
  try {
    const { id, nombre_completo, correo_electronico, telefono, rol } = req.body;
    if (!id || !correo_electronico) {
      return res.status(400).json({ error: 'ID y correo son obligatorios' });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn(
        '[fallback] SUPABASE_SERVICE_ROLE_KEY no está configurada. ' +
          'Sin ella, RLS bloqueará el INSERT en public.usuarios. ' +
          'Obtén la clave en: Supabase Dashboard → Settings → API → service_role key',
      );
    }

    const supabase = require('./db');
    console.log(
      '[fallback] Intentando upsert en usuarios. id=' +
        id +
        ' email=' +
        correo_electronico,
    );

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
      console.error(
        '[fallback] Error upsert usuarios:',
        error.code,
        error.message,
        error.details,
      );
      if (error.code === '42501') {
        return res.status(500).json({
          error:
            'RLS bloqueó el INSERT. Configura SUPABASE_SERVICE_ROLE_KEY en tu .env',
        });
      }
      if (error.code === '23503') {
        return res.status(500).json({
          error:
            'El usuario aún no existe en auth.users (FK violation). Espera un momento e intenta de nuevo.',
        });
      }
      return res.status(500).json({ error: error.message });
    }

    console.log('[fallback] Upsert exitoso en usuarios:', data);
    return res.json({ success: true, message: 'Usuario sincronizado' });
  } catch (err) {
    console.error('[fallback] Error crítico:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

aplicacion.post(
  '/api/productos/stock-batch',
  express.json(),
  async (peticion, respuesta) => {
    try {
      const ids =
        peticion.body && Array.isArray(peticion.body.ids)
          ? peticion.body.ids
          : [];
      if (!ids.length)
        return respuesta.status(400).json({ error: 'ids array required' });

      const supabase = require('./db');
      const { data, error } = await supabase
        .from('productos')
        .select('id, stock_disponible')
        .in('id', ids);

      if (error) return respuesta.status(500).json({ error: error.message });

      return respuesta.json({ stocks: data });
    } catch (err) {
      console.error('Error stock-batch:', err);
      return respuesta.status(500).json({ error: err.message });
    }
  },
);

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
  const rutaCarrito = ruta.join(__dirname, '..', 'html', 'carrito.html');
  respuesta.sendFile(rutaCarrito);
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
