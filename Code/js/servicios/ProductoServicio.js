class ProductoServicio {
  constructor() {
    this.urlBase = '/api';
  }

  obtenerProductos(filtros) {
    var parametros = new URLSearchParams();

    if (filtros) {
      if (filtros.categoria) parametros.set('categoria', filtros.categoria);
      if (filtros.busqueda) parametros.set('busqueda', filtros.busqueda);
      if (filtros.precioMinimo)
        parametros.set('precioMinimo', filtros.precioMinimo);
      if (filtros.precioMaximo)
        parametros.set('precioMaximo', filtros.precioMaximo);
      if (filtros.soloDisponibles)
        parametros.set('soloDisponibles', filtros.soloDisponibles);
    }

    var cadenaParametros = parametros.toString();
    var url =
      this.urlBase +
      '/productos' +
      (cadenaParametros ? '?' + cadenaParametros : '');

    return fetch(url).then(function (respuesta) {
      if (!respuesta.ok) throw new Error('Error al obtener productos');
      return respuesta.json();
    });
  }

  obtenerProductoPorId(idProducto) {
    return fetch(this.urlBase + '/productos/' + idProducto).then(
      function (respuesta) {
        if (!respuesta.ok) throw new Error('Producto no encontrado');
        return respuesta.json();
      },
    );
  }

  verificarStock(idProducto) {
    return fetch(this.urlBase + '/productos/' + idProducto + '/stock').then(
      function (respuesta) {
        if (!respuesta.ok) throw new Error('Error al verificar stock');
        return respuesta.json();
      },
    );
  }

  verificarStockLote(listaIds) {
    return fetch(this.urlBase + '/productos/stock-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: listaIds }),
    }).then(function (respuesta) {
      if (!respuesta.ok) throw new Error('Error al verificar stock en lote');
      return respuesta.json();
    });
  }
}
