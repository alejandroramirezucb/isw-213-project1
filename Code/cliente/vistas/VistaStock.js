class VistaStock {
  constructor() {
    document.addEventListener('catalogo:cargado', (e) => this._renderizarTablaStock(e.detail.productos));
    this._bindBtnActualizar();
  }

  _bindBtnActualizar() {
    const btn = document.getElementById('btn-actualizar-alertas');
    btn?.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('stock:actualizacionSolicitada'));
    });
  }

  _renderizarTablaStock(productos) {
    const tbody = document.getElementById('tabla-stock-body');
    if (!tbody) return;

    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    if (!productos.length) {
      const trVacio = document.createElement('tr');
      const tdVacio = document.createElement('td');
      tdVacio.className = 'panel-admin__tabla-td';
      tdVacio.colSpan = 4;
      tdVacio.textContent = 'No hay productos';
      trVacio.appendChild(tdVacio);
      tbody.appendChild(trVacio);
      return;
    }

    productos.forEach((producto) => tbody.appendChild(this._crearFilaStock(producto)));
  }

  _crearFilaStock(producto) {
    const stock = producto.stock_disponible || 0;
    const tr = document.createElement('tr');

    const tdNombre = document.createElement('td');
    tdNombre.className = 'panel-admin__tabla-td';
    tdNombre.textContent = producto.nombre;
    tr.appendChild(tdNombre);

    const tdStock = document.createElement('td');
    tdStock.className = 'panel-admin__tabla-td';
    tdStock.textContent = stock;
    tr.appendChild(tdStock);

    const tdEstado = document.createElement('td');
    tdEstado.className = 'panel-admin__tabla-td';
    const spanEstado = document.createElement('span');
    if (stock <= 0) {
      spanEstado.className = 'panel-admin__estado panel-admin__estado--agotado';
      spanEstado.textContent = 'Agotado';
    } else if (stock <= 5) {
      spanEstado.className = 'panel-admin__estado panel-admin__estado--critico';
      spanEstado.textContent = 'Crítico';
    } else {
      spanEstado.className = 'panel-admin__estado panel-admin__estado--activo';
      spanEstado.textContent = 'Disponible';
    }
    tdEstado.appendChild(spanEstado);
    tr.appendChild(tdEstado);

    const tdAjustar = document.createElement('td');
    tdAjustar.className = 'panel-admin__tabla-td';
    const divInput = document.createElement('div');
    divInput.className = 'panel-admin__stock-input';

    const inputStock = document.createElement('input');
    inputStock.type = 'number';
    inputStock.min = '0';
    inputStock.value = stock;
    divInput.appendChild(inputStock);

    const btnGuardar = document.createElement('button');
    btnGuardar.className = 'panel-admin__boton panel-admin__boton--primario panel-admin__boton--pequeno';
    btnGuardar.textContent = 'Guardar';
    btnGuardar.addEventListener('click', () => {
      const nuevoStock = parseInt(inputStock.value, 10);
      if (isNaN(nuevoStock) || nuevoStock < 0) return;
      document.dispatchEvent(new CustomEvent('stock:guardadoSolicitado', {
        detail: { productoId: producto.id, nuevoStock },
      }));
    });
    divInput.appendChild(btnGuardar);

    tdAjustar.appendChild(divInput);
    tr.appendChild(tdAjustar);

    return tr;
  }

  renderizarAlertas(productos, umbral) {
    const tbody = document.getElementById('tabla-alertas-body');
    const mensajeVacio = document.getElementById('mensaje-sin-alertas') || document.querySelector('.panel-admin__sin-alertas');
    if (!tbody) return;

    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    if (!productos.length) {
      if (mensajeVacio) mensajeVacio.style.display = 'block';
      const trVacio = document.createElement('tr');
      const tdVacio = document.createElement('td');
      tdVacio.className = 'panel-admin__tabla-td';
      tdVacio.colSpan = 4;
      tdVacio.textContent = 'No hay productos con stock bajo';
      trVacio.appendChild(tdVacio);
      tbody.appendChild(trVacio);
      return;
    }

    if (mensajeVacio) mensajeVacio.style.display = 'none';
    productos.forEach((producto) => tbody.appendChild(this._crearFilaAlerta(producto, umbral)));
  }

  _crearFilaAlerta(producto, umbral) {
    const stock = producto.stock_disponible || 0;
    const tr = document.createElement('tr');

    const tdNombre = document.createElement('td');
    tdNombre.className = 'panel-admin__tabla-td';
    tdNombre.textContent = producto.nombre;
    tr.appendChild(tdNombre);

    const tdStock = document.createElement('td');
    tdStock.className = 'panel-admin__tabla-td';
    tdStock.textContent = stock;
    tr.appendChild(tdStock);

    const tdNivel = document.createElement('td');
    tdNivel.className = 'panel-admin__tabla-td';
    const spanNivel = document.createElement('span');
    if (stock <= 0) {
      spanNivel.className = 'panel-admin__estado panel-admin__estado--agotado';
      spanNivel.textContent = 'Agotado';
    } else if (stock <= Math.floor(umbral / 2)) {
      spanNivel.className = 'panel-admin__estado panel-admin__estado--critico';
      spanNivel.textContent = 'Crítico';
    } else {
      spanNivel.className = 'panel-admin__estado panel-admin__estado--bajo';
      spanNivel.textContent = 'Bajo';
    }
    tdNivel.appendChild(spanNivel);
    tr.appendChild(tdNivel);

    const tdAccion = document.createElement('td');
    tdAccion.className = 'panel-admin__tabla-td';
    const btnReabastecer = document.createElement('button');
    btnReabastecer.className = 'panel-admin__boton panel-admin__boton--primario panel-admin__boton--pequeno';
    btnReabastecer.textContent = 'Reabastecer';
    btnReabastecer.addEventListener('click', () => {
      const nuevaCantidad = prompt(`Ingresa la nueva cantidad de stock para "${producto.nombre}":`, '');
      if (nuevaCantidad === null) return;
      const cantidad = parseInt(nuevaCantidad, 10);
      if (isNaN(cantidad) || cantidad < 0) {
        if (window.showToast) window.showToast('Cantidad inválida', { tipo: 'warning' });
        return;
      }
      document.dispatchEvent(new CustomEvent('stock:guardadoSolicitado', {
        detail: { productoId: producto.id, nuevoStock: cantidad },
      }));
    });
    tdAccion.appendChild(btnReabastecer);
    tr.appendChild(tdAccion);

    return tr;
  }
}

export default VistaStock;
