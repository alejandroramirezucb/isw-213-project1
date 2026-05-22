const express = require('express');
const router = express.Router();

const CDN_LEAFLET = `
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
`;

const SCRIPTS_ADMIN = `
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/html-docx-js@0.3.1/dist/html-docx.js"></script>
`;

router.get('/', (req, res) => res.render('index', {
  title: 'Raidencenter - Tienda de Tecnología',
  pageCSS: ['styles', 'navbar', 'filtros', 'producto-tarjeta'],
  pageScript: 'index',
}));

router.get('/admin', (req, res) => res.render('admin', {
  title: 'Panel de Administración - Raidencenter',
  pageCSS: ['navbar', 'styles', 'admin'],
  pageScript: 'admin',
  extraLinks: CDN_LEAFLET,
  extraScripts: SCRIPTS_ADMIN,
}));

router.get('/carrito', (req, res) => res.render('carrito', {
  title: 'Carrito de Compras - Raidencenter',
  pageCSS: ['navbar', 'carrito', 'filtros', 'styles'],
  pageScript: 'carrito',
}));

router.get('/historial', (req, res) => res.render('historial', {
  title: 'Mis Pedidos - Raidencenter',
  pageCSS: ['styles', 'navbar', 'historial'],
  pageScript: 'historial',
}));

router.get('/perfil', (req, res) => res.render('perfil', {
  title: 'Mi Perfil - Raidencenter',
  pageCSS: ['navbar', 'styles', 'perfil'],
  pageScript: 'perfil',
}));

router.get('/chofer', (req, res) => res.render('chofer', {
  title: 'Panel de Chofer - Raidencenter',
  pageCSS: ['navbar', 'styles', 'chofer'],
  pageScript: 'chofer',
}));

router.get('/ayuda', (req, res) => res.render('ayuda', {
  title: 'Centro de Ayuda - Raidencenter',
  pageCSS: ['navbar', 'styles', 'ayuda'],
  pageScript: 'ayuda',
}));

router.get('/login', (req, res) => res.render('login', {
  title: 'Iniciar Sesión - Raidencenter',
  pageCSS: ['styles', 'navbar', 'auth'],
  pageScript: 'auth',
}));

router.get('/register', (req, res) => res.render('register', {
  title: 'Registrarse - Raidencenter',
  pageCSS: ['styles', 'navbar', 'auth'],
  pageScript: 'auth',
}));

router.get('/producto/:id', (req, res) => res.render('producto-detalle', {
  title: 'Detalle del Producto - Raidencenter',
  pageCSS: ['styles', 'navbar', 'producto-detalle'],
  pageScript: 'producto-detalle',
}));

router.get('/user', (req, res) => res.redirect('/perfil'));

router.use((req, res) => res.render('index', {
  title: 'Raidencenter - Tienda de Tecnología',
  pageCSS: ['styles', 'navbar', 'filtros', 'producto-tarjeta'],
  pageScript: 'index',
}));

module.exports = router;
