const express = require('express');
const ruta = require('path');
const aplicacion = express();
const supabase = require('./db');
const { validarConfiguracion, mapearProducto } = require('./utils');

if (!validarConfiguracion()) {
    console.error('Error: Configuración incompleta. Revisa tu archivo .env');
    process.exit(1);
}

aplicacion.use(express.static(ruta.join(__dirname, '..')));
aplicacion.use(express.json());

aplicacion.get('/api/productos', async function(peticion, respuesta) {
    try {
        let query = supabase
            .from('productos')
            .select(`
                id,
                nombre,
                descripcion,
                precio_actual,
                stock_disponible,
                url_imagen,
                estado,
                categorias (
                    id,
                    nombre,
                    descripcion
                )
            `)
            .eq('estado', 'activo');

        if (peticion.query.categoria) {
            let nombreCategoria = peticion.query.categoria.split('-').join(' ');
            query = query.eq('categorias.nombre', nombreCategoria);
        }

        if (peticion.query.q) {
            query = query.ilike('nombre', `%${peticion.query.q}%`);
        }

        const { data: listaProductos, error } = await query;

        if (error) {
            console.error('Error al obtener productos:', error);
            return respuesta.status(500).json({ error: 'Error al obtener productos' });
        }

        const productosFormateados = listaProductos.map(mapearProducto);

        respuesta.json(productosFormateados);
    } catch (error) {
        console.error('Error en /api/productos:', error);
        respuesta.status(500).json({ error: 'Error interno del servidor' });
    }
});

aplicacion.use(function(peticion, respuesta) {
    respuesta.sendFile(ruta.join(__dirname, '..', 'html', 'index.html'));
});

const puerto = process.env.PORT || 3000;

aplicacion.listen(puerto, function() {
    console.log('Servidor iniciado en puerto ' + puerto);
});

