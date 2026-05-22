require('dotenv').config();
const express = require('express');
const path = require('path');
const { engine } = require('express-handlebars');
const { validarConfiguracion } = require('./utils');

if (!validarConfiguracion()) process.exit(1);

const app = express();

app.engine('hbs', engine({
  extname: '.hbs',
  defaultLayout: 'principal',
  layoutsDir: path.join(__dirname, '..', 'plantillas', 'layouts'),
  partialsDir: path.join(__dirname, '..', 'plantillas', 'parciales'),
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, '..', 'plantillas'));

app.use(express.static(path.join(__dirname, '..')));
app.use(express.json());

app.get('/config', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_ANON_KEY,
  });
});

app.get('/api/producto-tarjeta', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'plantillas', 'parciales', 'tarjeta-producto.html'));
});

app.use('/api/productos', require('./rutas/rutasProductos'));
app.use('/api/pedidos', require('./rutas/rutasPedidos'));
app.use('/api/devoluciones', require('./rutas/rutasDevoluciones'));
app.use('/api/envios', require('./rutas/rutasEnvios'));
app.use('/api/mensajes-ayuda', require('./rutas/rutasMensajes'));
app.use('/api/usuarios', require('./rutas/rutasUsuarios'));

app.use('/', require('./rutas/rutasVistas'));

const puerto = process.env.PORT || 3000;
app.listen(puerto, () => {
  console.log(`Servidor iniciado en puerto ${puerto}`);
});
