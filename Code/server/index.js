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

aplicacion.get('/api/navbar', (req, res) => {
    const navbarPath = ruta.join(__dirname, '..', 'html', 'navbar.html');
    res.sendFile(navbarPath);
});

aplicacion.get('/api/producto-tarjeta', (req, res) => {
    const tarjetaPath = ruta.join(__dirname, '..', 'html', 'producto-tarjeta.html');
    res.sendFile(tarjetaPath);
});

aplicacion.get('/api/productos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data: producto, error } = await supabase
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
            .eq('id', id)
            .single();

        if (error) throw error;
        res.json(mapearProducto(producto));
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el producto' });
    }
});

aplicacion.get('/producto/:id', (req, res) => {
    res.sendFile(ruta.join(__dirname, '..', 'html', 'producto-detalle.html'));
});

aplicacion.get('/carrito', (req, res) => {
    const carritoPath = ruta.join(__dirname, '..', 'html', 'carrito.html');
    res.sendFile(carritoPath);
});

aplicacion.get('/', (peticion, respuesta) => {
    respuesta.sendFile(ruta.join(__dirname, '..', 'html', 'index.html'));
});

aplicacion.get('/api/productos', async function(peticion, respuesta) {
    try {
        let listaProductos = [];
        let error = null;

        if (peticion.query.categoria) {
            let nombreCategoria = peticion.query.categoria.split('-').join(' ');
            const { data, error: rpcError } = await supabase.rpc('seleccionar_productos_por_categoria', {
                categoria_nombre: nombreCategoria
            });
            listaProductos = data;
            error = rpcError;

            if (peticion.query.q && listaProductos) {
                const search = peticion.query.q.toLowerCase();
                listaProductos = listaProductos.filter(p => 
                    (p.nombre_producto && p.nombre_producto.toLowerCase().includes(search)) ||
                    (p.descripcion_producto && p.descripcion_producto.toLowerCase().includes(search))
                );
            }
        } else {
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
                    categorias (id, nombre)
                `)
                .eq('estado', 'activo');

            if (peticion.query.q) {
                query = query.ilike('nombre', `%${peticion.query.q}%`);
            }

            const { data, error: dbError } = await query;
            listaProductos = data;
            error = dbError;
        }

        if (error) {
            console.error('Error al obtener productos:', error);
            return respuesta.status(500).json({ error: 'Error al obtener productos', detalles: error.message });
        }

        if (!listaProductos) {
            return respuesta.json([]);
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
