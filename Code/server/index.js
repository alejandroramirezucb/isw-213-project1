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
const servicioProductos = new ServicioProductos(repositorioProductos, { mapear: mapearProducto });
const controladorProductos = new ControladorProductos(servicioProductos);

aplicacion.use(express.static(ruta.join(__dirname, '..')));
aplicacion.use(express.json());

aplicacion.get('/api/navbar', (peticion, respuesta) => {
    const rutaNavbar = ruta.join(__dirname, '..', 'html', 'navbar.html');
    respuesta.sendFile(rutaNavbar);
});

aplicacion.get('/api/producto-tarjeta', (peticion, respuesta) => {
    const rutaTarjeta = ruta.join(__dirname, '..', 'html', 'producto-tarjeta.html');
    respuesta.sendFile(rutaTarjeta);
});

aplicacion.get('/api/productos', (peticion, respuesta) => 
    controladorProductos.obtenerTodos(peticion, respuesta)
);

aplicacion.get('/api/productos/:id', (peticion, respuesta) => 
    controladorProductos.obtenerPorId(peticion, respuesta)
);

aplicacion.get('/api/productos/:id/stock', (peticion, respuesta) => 
    controladorProductos.verificarStock(peticion, respuesta)
);

aplicacion.get('/producto/:id', (peticion, respuesta) => {
    respuesta.sendFile(ruta.join(__dirname, '..', 'html', 'producto-detalle.html'));
});

aplicacion.get('/carrito', (peticion, respuesta) => {
    const rutaCarrito = ruta.join(__dirname, '..', 'html', 'carrito.html');
    respuesta.sendFile(rutaCarrito);
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

