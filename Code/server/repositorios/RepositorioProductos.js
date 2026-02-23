const supabase = require('../db');

function eliminarAcentos(texto) {
  if (!texto) return texto;
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

class RepositorioProductos {
  async obtenerTodos(filtros = {}) {
    let consulta = supabase
      .from('productos')
      .select(
        'id, nombre, descripcion, precio_actual, stock_disponible, url_imagen, estado, categoria_id',
      )
      .eq('estado', 'activo');

    if (filtros.busqueda) {
      consulta = consulta.or(
        `nombre.ilike.%${filtros.busqueda}%,descripcion.ilike.%${filtros.busqueda}%`,
      );
    }
    if (filtros.precioMinimo) {
      consulta = consulta.gte(
        'precio_actual',
        parseFloat(filtros.precioMinimo),
      );
    }
    if (filtros.precioMaximo) {
      consulta = consulta.lte(
        'precio_actual',
        parseFloat(filtros.precioMaximo),
      );
    }
    if (filtros.soloDisponibles === 'true') {
      consulta = consulta.gt('stock_disponible', 0);
    }

    const { data, error } = await consulta;
    if (error) throw error;

    const categoriasMap = await this._obtenerMapaCategorias();
    return (data || []).map(function (producto) {
      producto.categoria_nombre = categoriasMap[producto.categoria_id] || '';
      return producto;
    });
  }

  async obtenerPorCategoria(nombreCategoria, filtros = {}) {
    const nombreOriginal = (nombreCategoria || '').toString();
    const nombreNormalizado = eliminarAcentos(nombreOriginal.toLowerCase())
      .replace(/\s+/g, ' ')
      .trim();

    const categoriaEncontrada = await this._buscarCategoria(nombreNormalizado);
    if (!categoriaEncontrada) return [];

    return this._obtenerProductosPorCategoriaId(
      categoriaEncontrada.id,
      filtros,
    );
  }

  async _obtenerMapaCategorias() {
    const { data, error } = await supabase
      .from('categorias')
      .select('id, nombre');

    if (error || !data) return {};

    var mapa = {};
    data.forEach(function (categoria) {
      mapa[categoria.id] = categoria.nombre;
    });
    return mapa;
  }

  async _buscarCategoria(nombreNormalizado) {
    const { data: categorias, error } = await supabase
      .from('categorias')
      .select('id, nombre');

    if (error || !categorias) return null;

    return categorias.find(function (categoria) {
      var nombreLimpio = eliminarAcentos((categoria.nombre || '').toLowerCase())
        .replace(/\s+/g, ' ')
        .trim();
      return (
        nombreLimpio === nombreNormalizado ||
        nombreLimpio.includes(nombreNormalizado) ||
        nombreNormalizado.includes(nombreLimpio)
      );
    });
  }

  async _obtenerProductosPorCategoriaId(categoriaId, filtros) {
    let consulta = supabase
      .from('productos')
      .select(
        'id, nombre, descripcion, precio_actual, stock_disponible, url_imagen, estado, categoria_id',
      )
      .eq('categoria_id', categoriaId)
      .eq('estado', 'activo');

    if (filtros.busqueda) {
      consulta = consulta.or(
        `nombre.ilike.%${filtros.busqueda}%,descripcion.ilike.%${filtros.busqueda}%`,
      );
    }
    if (filtros.precioMinimo) {
      consulta = consulta.gte(
        'precio_actual',
        parseFloat(filtros.precioMinimo),
      );
    }
    if (filtros.precioMaximo) {
      consulta = consulta.lte(
        'precio_actual',
        parseFloat(filtros.precioMaximo),
      );
    }
    if (filtros.soloDisponibles === 'true') {
      consulta = consulta.gt('stock_disponible', 0);
    }

    const { data, error } = await consulta;
    if (error) throw error;
    return data || [];
  }

  async obtenerPorId(idProducto) {
    const { data, error } = await supabase
      .from('productos')
      .select(
        'id, nombre, descripcion, precio_actual, stock_disponible, url_imagen, estado, categoria_id',
      )
      .eq('id', idProducto)
      .single();

    if (error) throw error;

    if (data && data.categoria_id) {
      const { data: categoria } = await supabase
        .from('categorias')
        .select('id, nombre, descripcion')
        .eq('id', data.categoria_id)
        .single();

      data.categoria_nombre = categoria ? categoria.nombre : '';
      data.categoria_descripcion = categoria ? categoria.descripcion : '';
    }

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
