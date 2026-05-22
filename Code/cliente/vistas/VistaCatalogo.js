class VistaCatalogo {
  constructor() {
    document.addEventListener('catalogo:cargado', (e) => this._renderizar(e.detail));
    this._bindBtnCrear();
  }

  _bindBtnCrear() {
    const btnCrear = document.getElementById('btn-crear-producto');
    btnCrear?.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('catalogo:nuevoSolicitado'));
    });
  }

  _renderizar({ productos, categorias }) {
    this._actualizarSelectCategorias(categorias);
    const tbody = document.getElementById('tabla-productos-body');
    if (!tbody) return;

    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    if (!productos.length) {
      const trVacio = document.createElement('tr');
      const tdVacio = document.createElement('td');
      tdVacio.className = 'panel-admin__tabla-td';
      tdVacio.colSpan = 7;
      tdVacio.textContent = 'No hay productos registrados';
      trVacio.appendChild(tdVacio);
      tbody.appendChild(trVacio);
      return;
    }

    const mapaCategorias = Object.fromEntries(categorias.map((c) => [c.id, c.nombre]));

    productos.forEach((producto) => tbody.appendChild(this._crearFila(producto, mapaCategorias)));
  }

  _crearFila(producto, mapaCategorias) {
    const tr = document.createElement('tr');

    const tdImg = document.createElement('td');
    tdImg.className = 'panel-admin__tabla-td';
    if (producto.url_imagen) {
      const img = document.createElement('img');
      img.src = producto.url_imagen;
      img.alt = producto.nombre;
      img.className = 'panel-admin__imagen-miniatura';
      tdImg.appendChild(img);
    }
    tr.appendChild(tdImg);

    [
      producto.nombre,
      mapaCategorias[producto.categoria_id] || 'Sin categoría',
      `Bs. ${(producto.precio_actual || 0).toFixed(2)}`,
      String(producto.stock_disponible || 0),
    ].forEach((texto) => {
      const td = document.createElement('td');
      td.className = 'panel-admin__tabla-td';
      td.textContent = texto;
      tr.appendChild(td);
    });

    const tdEstado = document.createElement('td');
    tdEstado.className = 'panel-admin__tabla-td';
    const estaAgotado = (producto.stock_disponible || 0) <= 0;
    const spanEstado = document.createElement('span');
    spanEstado.className = `panel-admin__estado ${estaAgotado ? 'panel-admin__estado--agotado' : 'panel-admin__estado--activo'}`;
    spanEstado.textContent = estaAgotado ? 'Agotado' : 'Activo';
    tdEstado.appendChild(spanEstado);
    tr.appendChild(tdEstado);

    const tdAcciones = document.createElement('td');
    tdAcciones.className = 'panel-admin__tabla-td';
    const divAcciones = document.createElement('div');
    divAcciones.className = 'panel-admin__acciones-celda';

    const btnEditar = document.createElement('button');
    btnEditar.className = 'panel-admin__boton panel-admin__boton--primario panel-admin__boton--pequeno';
    btnEditar.textContent = 'Editar';
    btnEditar.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('catalogo:editarSolicitado', { detail: { producto } }));
    });
    divAcciones.appendChild(btnEditar);

    const btnEliminar = document.createElement('button');
    btnEliminar.className = 'panel-admin__boton panel-admin__boton--peligro panel-admin__boton--pequeno';
    btnEliminar.textContent = 'Eliminar';
    btnEliminar.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('catalogo:eliminarSolicitado', { detail: { productoId: producto.id, nombreProducto: producto.nombre } }));
    });
    divAcciones.appendChild(btnEliminar);

    tdAcciones.appendChild(divAcciones);
    tr.appendChild(tdAcciones);

    return tr;
  }

  _actualizarSelectCategorias(categorias) {
    const select = document.getElementById('producto-categoria');
    if (!select) return;
    while (select.options.length > 1) select.remove(1);
    categorias.forEach((cat) => {
      const option = document.createElement('option');
      option.value = cat.id;
      option.textContent = cat.nombre;
      select.appendChild(option);
    });
  }

  abrirModalNuevo() {
    this._limpiarFormulario();
    const titulo = document.getElementById('modal-titulo');
    if (titulo) titulo.textContent = 'Nuevo Producto';
    document.getElementById('modal-producto')?.classList.add('panel-admin__modal-overlay--visible');
  }

  abrirModalEdicion(producto) {
    const titulo = document.getElementById('modal-titulo');
    if (titulo) titulo.textContent = 'Editar Producto';
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    set('producto-id', producto.id);
    set('producto-nombre', producto.nombre);
    set('producto-descripcion', producto.descripcion);
    set('producto-precio', producto.precio_actual);
    set('producto-stock', producto.stock_disponible);
    set('producto-categoria', producto.categoria_id);
    set('producto-imagen', producto.url_imagen);
    document.getElementById('modal-producto')?.classList.add('panel-admin__modal-overlay--visible');
  }

  cerrarModal() {
    document.getElementById('modal-producto')?.classList.remove('panel-admin__modal-overlay--visible');
  }

  obtenerDatosFormulario() {
    const get = (id) => document.getElementById(id);
    return {
      id: get('producto-id')?.value || null,
      datos: {
        nombre: get('producto-nombre')?.value.trim(),
        descripcion: get('producto-descripcion')?.value.trim(),
        precio_actual: parseFloat(get('producto-precio')?.value),
        stock_disponible: parseInt(get('producto-stock')?.value, 10),
        categoria_id: parseInt(get('producto-categoria')?.value, 10),
        url_imagen: get('producto-imagen')?.value.trim() || null,
        estado: 'activo',
      },
    };
  }

  _limpiarFormulario() {
    ['producto-id', 'producto-nombre', 'producto-descripcion', 'producto-precio', 'producto-stock', 'producto-categoria', 'producto-imagen'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  }
}

export default VistaCatalogo;
