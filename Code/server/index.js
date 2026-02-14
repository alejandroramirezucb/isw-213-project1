const express = require('express');
const ruta = require('path');
const aplicacion = express();
const conectarBaseDeDatos = require('./db');
const ModeloProducto = require('./models/producto');

conectarBaseDeDatos();

aplicacion.use(express.static(ruta.join(__dirname, '..')));

aplicacion.get('/api/productos', function(peticion, respuesta) {
    let filtro = {};
    if (peticion.query.categoria) {
        let nombreCategoria = peticion.query.categoria.split('-').join(' ');
        filtro.category = { $regex: new RegExp("^" + nombreCategoria + "$", "i") };
    }
    ModeloProducto.find(filtro).then(function(listaProductos) {
        respuesta.json(listaProductos);
    });
});

aplicacion.use(function(peticion, respuesta) {
    respuesta.sendFile(ruta.join(__dirname, '..', 'html', 'index.html'));
});

aplicacion.listen(3000, function() {
    console.log('Servidor iniciado en puerto 3000');
});
