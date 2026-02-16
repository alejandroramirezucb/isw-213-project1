const supabase = require('../db');

function eliminarAcentos(texto) {
    if (!texto) return texto;
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

class RepositorioProductos {
    async obtenerTodos(filtros = {}) {
        let consulta = supabase
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

        if (filtros.busqueda)
            consulta = consulta.or(`nombre.ilike.%${filtros.busqueda}%,descripcion.ilike.%${filtros.busqueda}%`);

        if (filtros.precioMinimo)
            consulta = consulta.gte('precio_actual', parseFloat(filtros.precioMinimo));

        if (filtros.precioMaximo)
            consulta = consulta.lte('precio_actual', parseFloat(filtros.precioMaximo));

        if (filtros.soloDisponibles === 'true')
            consulta = consulta.gt('stock_disponible', 0);

        const { data, error } = await consulta;
        
        if (error) throw error;
        
        return data;
    }

    async obtenerPorCategoria(nombreCategoria, filtros = {}) {
        const original = (nombreCategoria || '').toString();
        const sinAcentosInput = eliminarAcentos(original.toLowerCase()).replace(/\s+/g, ' ').trim();

        const { data: categorias, error: errorCategorias } = await supabase
            .from('categorias')
            .select('id, nombre');

        if (!errorCategorias && categorias && categorias.length > 0) {
            let categoriaEncontrada = categorias.find(cat => {
                const n = eliminarAcentos((cat.nombre || '').toLowerCase()).replace(/\s+/g, ' ').trim();
                return n === sinAcentosInput;
            });

            if (!categoriaEncontrada) {
                categoriaEncontrada = categorias.find(cat => {
                    const n = eliminarAcentos((cat.nombre || '').toLowerCase()).replace(/\s+/g, ' ').trim();
                    return n.includes(sinAcentosInput) || sinAcentosInput.includes(n);
                });
            }

            if (categoriaEncontrada) {
                const { data: productosData, error: errorProductos } = await supabase
                    .from('productos')
                    .select('id, nombre, descripcion, precio_actual, stock_disponible, url_imagen')
                    .eq('categoria_id', categoriaEncontrada.id)
                    .eq('estado', 'activo');

                if (!errorProductos) {
                    let productos = productosData || [];

                    if (filtros.busqueda) {
                        const terminoBusqueda = filtros.busqueda.toLowerCase();
                        productos = productos.filter(producto =>
                            (producto.nombre && producto.nombre.toLowerCase().includes(terminoBusqueda)) ||
                            (producto.descripcion && producto.descripcion.toLowerCase().includes(terminoBusqueda))
                        );
                    }

                    if (filtros.precioMinimo) {
                        const min = parseFloat(filtros.precioMinimo);
                        productos = productos.filter(producto => producto.precio_actual >= min);
                    }

                    if (filtros.precioMaximo) {
                        const max = parseFloat(filtros.precioMaximo);
                        productos = productos.filter(producto => producto.precio_actual <= max);
                    }

                    if (filtros.soloDisponibles === 'true') {
                        productos = productos.filter(producto => producto.stock_disponible > 0);
                    }

                    return productos;
                }
            }
        }

        const variantes = [original, original.trim(), original.replace(/-/g, ' '), original.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' '), original.toLowerCase(), original.toUpperCase(), sinAcentosInput, sinAcentosInput.toLowerCase(), sinAcentosInput.toUpperCase()];

        for (const variante of variantes) {
            if (!variante) continue;
            try {
                const { data: dataRpc, error: errorRpc } = await supabase.rpc('seleccionar_productos_por_categoria', {
                    categoria_nombre: variante
                });
                if (errorRpc) continue;
                if (dataRpc && dataRpc.length > 0) {
                    let productos = dataRpc.map(p => ({
                        id: p.id_producto,
                        nombre: p.nombre_producto,
                        descripcion: p.descripcion_producto,
                        precio_actual: p.precio_actual,
                        stock_disponible: p.stock_disponible,
                        url_imagen: p.url_imagen
                    }));

                    if (filtros.busqueda) {
                        const terminoBusqueda = filtros.busqueda.toLowerCase();
                        productos = productos.filter(producto =>
                            (producto.nombre && producto.nombre.toLowerCase().includes(terminoBusqueda)) ||
                            (producto.descripcion && producto.descripcion.toLowerCase().includes(terminoBusqueda))
                        );
                    }

                    if (filtros.precioMinimo) {
                        const min = parseFloat(filtros.precioMinimo);
                        productos = productos.filter(producto => producto.precio_actual >= min);
                    }

                    if (filtros.precioMaximo) {
                        const max = parseFloat(filtros.precioMaximo);
                        productos = productos.filter(producto => producto.precio_actual <= max);
                    }

                    if (filtros.soloDisponibles === 'true') {
                        productos = productos.filter(producto => producto.stock_disponible > 0);
                    }

                    return productos;
                }
            } catch (rpcError) {}
        }

        const { data, error } = await supabase
            .from('productos')
            .select(`
                id,
                nombre,
                descripcion,
                precio_actual,
                stock_disponible,
                url_imagen,
                estado,
                categorias!inner (id, nombre)
            `)
            .eq('estado', 'activo')
            .ilike('categorias.nombre', `%${original.replace(/-/g, ' ')}%`);

        if (error) throw error;

        let productos = data || [];

        if (filtros.busqueda) {
            const terminoBusqueda = filtros.busqueda.toLowerCase();
            productos = productos.filter(producto =>
                (producto.nombre && producto.nombre.toLowerCase().includes(terminoBusqueda)) ||
                (producto.descripcion && producto.descripcion.toLowerCase().includes(terminoBusqueda))
            );
        }

        if (filtros.precioMinimo) {
            const min = parseFloat(filtros.precioMinimo);
            productos = productos.filter(producto => producto.precio_actual >= min);
        }

        if (filtros.precioMaximo) {
            const max = parseFloat(filtros.precioMaximo);
            productos = productos.filter(producto => producto.precio_actual <= max);
        }

        if (filtros.soloDisponibles === 'true') {
            productos = productos.filter(producto => producto.stock_disponible > 0);
        }

        return productos;
    }

    async obtenerPorId(idProducto) {
        const { data, error } = await supabase
            .from('productos')
            .select(`
                id,
                nombre,
                descripcion,
                precio_actual,
                stock_disponible,
                url_imagen,
                estado,
                categorias (id, nombre, descripcion)
            `)
            .eq('id', idProducto)
            .single();

        if (error) throw error;
        
        return data;
    }

    async obtenerStock(idProducto) {
        const { data, error } = await supabase
            .from('productos')
            .select('id, nombre, stock_disponible')
            .eq('id', idProducto)
            .single();

        if (error) throw error;
        
        return data;
    }
}

module.exports = RepositorioProductos;
