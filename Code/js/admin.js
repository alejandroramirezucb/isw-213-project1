document.addEventListener('DOMContentLoaded', function () {
  cargarNavbar().then(function () {
    obtenerClienteSupabase().then(function (clienteSupabase) {
      if (!clienteSupabase) {
        window.location.href = '/login';
        return;
      }
      clienteSupabase.auth.getSession().then(function (resultado) {
        var sesion = resultado.data.session;
        if (!sesion) {
          window.location.href = '/login';
          return;
        }
        verificarRolAdmin(clienteSupabase, sesion.user).then(
          function (esAdmin) {
            if (!esAdmin) {
              window.location.href = '/';
              return;
            }
            inicializarPanelAdmin(clienteSupabase);
          },
        );
      });
    });
  });
});

function verificarRolAdmin(clienteSupabase, usuario) {
  return clienteSupabase
    .from('usuarios')
    .select('rol')
    .eq('id', usuario.id)
    .single()
    .then(function (resultado) {
      if (resultado.error) return false;
      return resultado.data && resultado.data.rol === 'administrador';
    });
}

function inicializarPanelAdmin(clienteSupabase) {
  configurarPestanas();
  cargarCatalogo(clienteSupabase);
  cargarStock(clienteSupabase);
  cargarAlertasStock(clienteSupabase);
  configurarModalProducto(clienteSupabase);
  configurarReportes(clienteSupabase);
  configurarAlertasUI(clienteSupabase);
  configurarMonitoreoRutas(clienteSupabase);
}

function configurarPestanas() {
  var pestanas = document.querySelectorAll('.panel-admin__pestana');
  pestanas.forEach(function (pestana) {
    pestana.addEventListener('click', function () {
      pestanas.forEach(function (p) {
        p.classList.remove('panel-admin__pestana--activa');
      });
      pestana.classList.add('panel-admin__pestana--activa');

      var secciones = document.querySelectorAll('.panel-admin__seccion');
      secciones.forEach(function (s) {
        s.classList.remove('panel-admin__seccion--activa');
      });

      var seccionId = 'seccion-' + pestana.getAttribute('data-seccion');
      var seccionActiva = document.getElementById(seccionId);
      if (seccionActiva) {
        seccionActiva.classList.add('panel-admin__seccion--activa');
      }
    });
  });
}

function cargarCatalogo(clienteSupabase) {
  var tbody = document.getElementById('tabla-productos-body');

  Promise.all([
    clienteSupabase.from('productos').select('*').order('nombre'),
    clienteSupabase.from('categorias').select('id, nombre'),
  ]).then(function (resultados) {
    var productos = resultados[0].data || [];
    var categorias = resultados[1].data || [];
    var mapaCategorias = {};
    categorias.forEach(function (cat) {
      mapaCategorias[cat.id] = cat.nombre;
    });

    cargarSelectCategorias(categorias);
    renderizarTablaProductos(tbody, productos, mapaCategorias, clienteSupabase);
  });
}

function cargarSelectCategorias(categorias) {
  var select = document.getElementById('producto-categoria');
  if (!select) return;

  while (select.options.length > 1) {
    select.remove(1);
  }

  categorias.forEach(function (cat) {
    var option = document.createElement('option');
    option.value = cat.id;
    option.textContent = cat.nombre;
    select.appendChild(option);
  });
}

function renderizarTablaProductos(
  tbody,
  productos,
  mapaCategorias,
  clienteSupabase,
) {
  while (tbody.firstChild) {
    tbody.removeChild(tbody.firstChild);
  }

  if (!productos.length) {
    var trVacio = document.createElement('tr');
    var tdVacio = document.createElement('td');
    tdVacio.className = 'panel-admin__tabla-td';
    tdVacio.colSpan = 7;
    tdVacio.textContent = 'No hay productos registrados';
    trVacio.appendChild(tdVacio);
    tbody.appendChild(trVacio);
    return;
  }

  productos.forEach(function (producto) {
    var tr = document.createElement('tr');

    var tdImg = document.createElement('td');
    tdImg.className = 'panel-admin__tabla-td';
    if (producto.url_imagen) {
      var img = document.createElement('img');
      img.src = producto.url_imagen;
      img.alt = producto.nombre;
      img.className = 'panel-admin__imagen-miniatura';
      tdImg.appendChild(img);
    }
    tr.appendChild(tdImg);

    var tdNombre = document.createElement('td');
    tdNombre.className = 'panel-admin__tabla-td';
    tdNombre.textContent = producto.nombre;
    tr.appendChild(tdNombre);

    var tdCat = document.createElement('td');
    tdCat.className = 'panel-admin__tabla-td';
    tdCat.textContent =
      mapaCategorias[producto.categoria_id] || 'Sin categoría';
    tr.appendChild(tdCat);

    var tdPrecio = document.createElement('td');
    tdPrecio.className = 'panel-admin__tabla-td';
    tdPrecio.textContent = 'Bs. ' + (producto.precio_actual || 0).toFixed(2);
    tr.appendChild(tdPrecio);

    var tdStock = document.createElement('td');
    tdStock.className = 'panel-admin__tabla-td';
    tdStock.textContent = producto.stock_disponible || 0;
    tr.appendChild(tdStock);

    var tdEstado = document.createElement('td');
    tdEstado.className = 'panel-admin__tabla-td';
    var spanEstado = document.createElement('span');
    var estaAgotado = (producto.stock_disponible || 0) <= 0;
    spanEstado.className =
      'panel-admin__estado ' +
      (estaAgotado
        ? 'panel-admin__estado--agotado'
        : 'panel-admin__estado--activo');
    spanEstado.textContent = estaAgotado ? 'Agotado' : 'Activo';
    tdEstado.appendChild(spanEstado);
    tr.appendChild(tdEstado);

    var tdAcciones = document.createElement('td');
    tdAcciones.className = 'panel-admin__tabla-td';
    var divAcciones = document.createElement('div');
    divAcciones.className = 'panel-admin__acciones-celda';

    var btnEditar = document.createElement('button');
    btnEditar.className =
      'panel-admin__boton panel-admin__boton--primario panel-admin__boton--pequeno';
    btnEditar.textContent = 'Editar';
    btnEditar.addEventListener('click', function () {
      abrirModalEdicion(producto);
    });
    divAcciones.appendChild(btnEditar);

    var btnEliminar = document.createElement('button');
    btnEliminar.className =
      'panel-admin__boton panel-admin__boton--peligro panel-admin__boton--pequeno';
    btnEliminar.textContent = 'Eliminar';
    btnEliminar.addEventListener('click', function () {
      eliminarProducto(clienteSupabase, producto.id);
    });
    divAcciones.appendChild(btnEliminar);

    tdAcciones.appendChild(divAcciones);
    tr.appendChild(tdAcciones);
    tbody.appendChild(tr);
  });
}

function configurarModalProducto(clienteSupabase) {
  var modal = document.getElementById('modal-producto');
  var btnCrear = document.getElementById('btn-crear-producto');
  var btnCerrar = document.getElementById('btn-cerrar-modal');
  var btnCancelar = document.getElementById('btn-cancelar-modal');
  var formulario = document.getElementById('form-producto');

  btnCrear.addEventListener('click', function () {
    limpiarFormulario();
    document.getElementById('modal-titulo').textContent = 'Nuevo Producto';
    modal.style.display = 'flex';
  });

  btnCerrar.addEventListener('click', function () {
    modal.style.display = 'none';
  });

  btnCancelar.addEventListener('click', function () {
    modal.style.display = 'none';
  });

  modal.addEventListener('click', function (evento) {
    if (evento.target === modal) {
      modal.style.display = 'none';
    }
  });

  formulario.addEventListener('submit', function (evento) {
    evento.preventDefault();
    guardarProducto(clienteSupabase);
  });
}

function limpiarFormulario() {
  document.getElementById('producto-id').value = '';
  document.getElementById('producto-nombre').value = '';
  document.getElementById('producto-descripcion').value = '';
  document.getElementById('producto-precio').value = '';
  document.getElementById('producto-stock').value = '';
  document.getElementById('producto-categoria').value = '';
  document.getElementById('producto-imagen').value = '';
}

function abrirModalEdicion(producto) {
  document.getElementById('modal-titulo').textContent = 'Editar Producto';
  document.getElementById('producto-id').value = producto.id;
  document.getElementById('producto-nombre').value = producto.nombre || '';
  document.getElementById('producto-descripcion').value =
    producto.descripcion || '';
  document.getElementById('producto-precio').value =
    producto.precio_actual || '';
  document.getElementById('producto-stock').value =
    producto.stock_disponible || '';
  document.getElementById('producto-categoria').value =
    producto.categoria_id || '';
  document.getElementById('producto-imagen').value = producto.url_imagen || '';
  document.getElementById('modal-producto').style.display = 'flex';
}

function guardarProducto(clienteSupabase) {
  var id = document.getElementById('producto-id').value;
  var datos = {
    nombre: document.getElementById('producto-nombre').value.trim(),
    descripcion: document.getElementById('producto-descripcion').value.trim(),
    precio_actual: parseFloat(document.getElementById('producto-precio').value),
    stock_disponible: parseInt(
      document.getElementById('producto-stock').value,
      10,
    ),
    categoria_id: parseInt(
      document.getElementById('producto-categoria').value,
      10,
    ),
    url_imagen: document.getElementById('producto-imagen').value.trim() || null,
    estado: 'activo',
  };

  var operacion;
  if (id) {
    operacion = clienteSupabase.from('productos').update(datos).eq('id', id);
  } else {
    operacion = clienteSupabase.from('productos').insert(datos);
  }

  operacion.then(function (resultado) {
    if (resultado.error) {
      if (window.showToast) {
        window.showToast('Error al guardar: ' + resultado.error.message, {
          tipo: 'error',
        });
      }
      return;
    }

    document.getElementById('modal-producto').style.display = 'none';
    if (window.showToast) {
      window.showToast(id ? 'Producto actualizado' : 'Producto creado', {
        tipo: 'success',
      });
    }
    cargarCatalogo(clienteSupabase);
    cargarStock(clienteSupabase);
    cargarAlertasStock(clienteSupabase);
  });
}

function eliminarProducto(clienteSupabase, productoId) {
  if (!confirm('¿Estás seguro de eliminar este producto?')) return;

  clienteSupabase
    .from('productos')
    .delete()
    .eq('id', productoId)
    .then(function (resultado) {
      if (resultado.error) {
        if (window.showToast) {
          window.showToast('Error al eliminar: ' + resultado.error.message, {
            tipo: 'error',
          });
        }
        return;
      }
      if (window.showToast) {
        window.showToast('Producto eliminado', { tipo: 'success' });
      }
      cargarCatalogo(clienteSupabase);
      cargarStock(clienteSupabase);
      cargarAlertasStock(clienteSupabase);
    });
}

function cargarStock(clienteSupabase) {
  var tbody = document.getElementById('tabla-stock-body');

  clienteSupabase
    .from('productos')
    .select('id, nombre, stock_disponible, estado')
    .order('nombre')
    .then(function (resultado) {
      var productos = resultado.data || [];

      while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
      }

      if (!productos.length) {
        var trVacio = document.createElement('tr');
        var tdVacio = document.createElement('td');
        tdVacio.className = 'panel-admin__tabla-td';
        tdVacio.colSpan = 4;
        tdVacio.textContent = 'No hay productos';
        trVacio.appendChild(tdVacio);
        tbody.appendChild(trVacio);
        return;
      }

      productos.forEach(function (producto) {
        var tr = document.createElement('tr');

        var tdNombre = document.createElement('td');
        tdNombre.className = 'panel-admin__tabla-td';
        tdNombre.textContent = producto.nombre;
        tr.appendChild(tdNombre);

        var tdStock = document.createElement('td');
        tdStock.className = 'panel-admin__tabla-td';
        tdStock.textContent = producto.stock_disponible || 0;
        tr.appendChild(tdStock);

        var tdEstado = document.createElement('td');
        tdEstado.className = 'panel-admin__tabla-td';
        var spanEstado = document.createElement('span');
        var stock = producto.stock_disponible || 0;
        if (stock <= 0) {
          spanEstado.className =
            'panel-admin__estado panel-admin__estado--agotado';
          spanEstado.textContent = 'Agotado';
        } else if (stock <= 5) {
          spanEstado.className =
            'panel-admin__estado panel-admin__estado--critico';
          spanEstado.textContent = 'Crítico';
        } else {
          spanEstado.className =
            'panel-admin__estado panel-admin__estado--activo';
          spanEstado.textContent = 'Disponible';
        }
        tdEstado.appendChild(spanEstado);
        tr.appendChild(tdEstado);

        var tdAjustar = document.createElement('td');
        tdAjustar.className = 'panel-admin__tabla-td';
        var divInput = document.createElement('div');
        divInput.className = 'panel-admin__stock-input';

        var inputStock = document.createElement('input');
        inputStock.type = 'number';
        inputStock.min = '0';
        inputStock.value = stock;
        divInput.appendChild(inputStock);

        var btnGuardar = document.createElement('button');
        btnGuardar.className =
          'panel-admin__boton panel-admin__boton--primario panel-admin__boton--pequeno';
        btnGuardar.textContent = 'Guardar';
        btnGuardar.addEventListener('click', function () {
          var nuevoStock = parseInt(inputStock.value, 10);
          if (isNaN(nuevoStock) || nuevoStock < 0) return;
          actualizarStock(clienteSupabase, producto.id, nuevoStock);
        });
        divInput.appendChild(btnGuardar);

        tdAjustar.appendChild(divInput);
        tr.appendChild(tdAjustar);
        tbody.appendChild(tr);
      });
    });
}

function actualizarStock(clienteSupabase, productoId, nuevoStock) {
  clienteSupabase
    .from('productos')
    .update({ stock_disponible: nuevoStock })
    .eq('id', productoId)
    .then(function (resultado) {
      if (resultado.error) {
        if (window.showToast) {
          window.showToast('Error al actualizar stock', { tipo: 'error' });
        }
        return;
      }
      if (window.showToast) {
        window.showToast('Stock actualizado', { tipo: 'success' });
      }
      cargarStock(clienteSupabase);
      cargarCatalogo(clienteSupabase);
      cargarAlertasStock(clienteSupabase);
    });
}

function configurarReportes(clienteSupabase) {
  var inputInicio = document.getElementById('reporte-fecha-inicio');
  var inputFin = document.getElementById('reporte-fecha-fin');
  var hoyStr = new Date().toISOString().split('T')[0];
  if (inputInicio) {
    inputInicio.setAttribute('max', hoyStr);
    inputInicio.addEventListener('change', function () {
      if (inputInicio.value > hoyStr) inputInicio.value = hoyStr;
    });
  }
  if (inputFin) {
    inputFin.setAttribute('max', hoyStr);
    inputFin.addEventListener('change', function () {
      if (inputFin.value > hoyStr) inputFin.value = hoyStr;
    });
  }

  var btnGenerar = document.getElementById('btn-generar-reporte');

  btnGenerar.addEventListener('click', function () {
    var fechaInicio = inputInicio.value;
    var fechaFin = inputFin.value;
    var formato = document.getElementById('reporte-formato').value;

    if (!fechaInicio || !fechaFin) {
      if (window.showToast) {
        window.showToast('Selecciona un rango de fechas', { tipo: 'warning' });
      }
      return;
    }

    if (fechaInicio > fechaFin) {
      if (window.showToast) {
        window.showToast('La fecha de inicio no puede ser mayor a la de fin', {
          tipo: 'warning',
        });
      }
      return;
    }

    var hoy = hoyStr;
    if (fechaInicio > hoy || fechaFin > hoy) {
      if (window.showToast) {
        window.showToast('No es posible generar reportes para fechas futuras', {
          tipo: 'warning',
        });
      }
      return;
    }

    generarReporte(clienteSupabase, fechaInicio, fechaFin, formato);
  });
}

function generarReporte(clienteSupabase, fechaInicio, fechaFin, formato) {
  var fechaFinAjustada = fechaFin + 'T23:59:59';

  Promise.all([
    clienteSupabase
      .from('pedidos')
      .select('id, monto_total, estado, fecha_creacion')
      .gte('fecha_creacion', fechaInicio)
      .lte('fecha_creacion', fechaFinAjustada),
    clienteSupabase
      .from('pagos')
      .select('metodo_pago, monto_total_pagado, pedido_id')
      .gte('created_at', fechaInicio)
      .lte('created_at', fechaFinAjustada),
  ]).then(function (resultados) {
    var pedidos = resultados[0].data || [];
    var pagos = resultados[1].data || [];

    var ingresos = 0;
    var devoluciones = 0;
    pedidos.forEach(function (pedido) {
      if (pedido.estado === 'devuelto') {
        devoluciones++;
      }
      ingresos += pedido.monto_total || 0;
    });

    document.getElementById('reporte-ingresos').textContent =
      'Bs. ' + ingresos.toFixed(2);
    document.getElementById('reporte-pedidos').textContent = pedidos.length;
    document.getElementById('reporte-devoluciones').textContent = devoluciones;

    var metodos = { efectivo: 0, tarjeta: 0, qr: 0 };
    pagos.forEach(function (pago) {
      var metodo = (pago.metodo_pago || '').toLowerCase();
      if (metodo === 'efectivo') metodos.efectivo++;
      else if (metodo === 'tarjeta') metodos.tarjeta++;
      else if (metodo === 'qr') metodos.qr++;
    });

    renderizarGraficoMetodos(metodos);
    document.getElementById('resumen-reporte').style.display = 'block';

    descargarReporte(
      pedidos,
      pagos,
      metodos,
      ingresos,
      devoluciones,
      fechaInicio,
      fechaFin,
      formato,
    );
  });
}

function renderizarGraficoMetodos(metodos) {
  var contenedor = document.getElementById('grafico-metodos-pago');
  while (contenedor.firstChild) {
    contenedor.removeChild(contenedor.firstChild);
  }

  var total = metodos.efectivo + metodos.tarjeta + metodos.qr;
  if (total === 0) total = 1;

  var datos = [
    {
      nombre: 'Efectivo',
      cantidad: metodos.efectivo,
      clase: 'panel-admin__barra-relleno--efectivo',
    },
    {
      nombre: 'Tarjeta',
      cantidad: metodos.tarjeta,
      clase: 'panel-admin__barra-relleno--tarjeta',
    },
    {
      nombre: 'QR',
      cantidad: metodos.qr,
      clase: 'panel-admin__barra-relleno--qr',
    },
  ];

  datos.forEach(function (dato) {
    var divBarra = document.createElement('div');
    divBarra.className = 'panel-admin__barra-grafico';

    var spanValor = document.createElement('span');
    spanValor.className = 'panel-admin__barra-valor';
    spanValor.textContent = dato.cantidad;
    divBarra.appendChild(spanValor);

    var divRelleno = document.createElement('div');
    divRelleno.className = 'panel-admin__barra-relleno ' + dato.clase;
    var porcentaje = Math.max((dato.cantidad / total) * 100, 4);
    divRelleno.style.height = porcentaje + '%';
    divBarra.appendChild(divRelleno);

    var spanLabel = document.createElement('span');
    spanLabel.className = 'panel-admin__barra-label';
    spanLabel.textContent = dato.nombre;
    divBarra.appendChild(spanLabel);

    contenedor.appendChild(divBarra);
  });
}

function descargarReporte(
  pedidos,
  pagos,
  metodos,
  ingresos,
  devoluciones,
  fechaInicio,
  fechaFin,
  formato,
) {
  var nombreArchivo = 'reporte_' + fechaInicio + '_' + fechaFin;

  if (formato === 'pdf') {
    descargarPDF(
      pedidos,
      metodos,
      ingresos,
      devoluciones,
      fechaInicio,
      fechaFin,
      nombreArchivo,
    );
  } else if (formato === 'excel') {
    descargarExcel(
      pedidos,
      metodos,
      ingresos,
      devoluciones,
      fechaInicio,
      fechaFin,
      nombreArchivo,
    );
  } else if (formato === 'doc') {
    descargarWord(
      pedidos,
      metodos,
      ingresos,
      devoluciones,
      fechaInicio,
      fechaFin,
      nombreArchivo,
    );
  }
}

function construirFilasPedidos(pedidos) {
  return pedidos.map(function (pedido) {
    return [
      String(pedido.id),
      'Bs. ' + (pedido.monto_total || 0).toFixed(2),
      pedido.estado || '',
      new Date(pedido.fecha_creacion).toLocaleDateString('es-BO'),
    ];
  });
}

function descargarPDF(
  pedidos,
  metodos,
  ingresos,
  devoluciones,
  fechaInicio,
  fechaFin,
  nombreArchivo,
) {
  var jsPDF = window.jspdf.jsPDF;
  var doc = new jsPDF();

  doc.setFontSize(18);
  doc.setTextColor(3, 78, 139);
  doc.text('Reporte de Ventas', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Período: ' + fechaInicio + ' al ' + fechaFin, 14, 28);

  doc.setFontSize(13);
  doc.setTextColor(30);
  doc.text('Resumen General', 14, 40);

  doc.autoTable({
    startY: 44,
    head: [['Concepto', 'Valor']],
    body: [
      ['Ingresos Totales', 'Bs. ' + ingresos.toFixed(2)],
      ['Total de Pedidos', String(pedidos.length)],
      ['Devoluciones', String(devoluciones)],
    ],
    theme: 'striped',
    headStyles: { fillColor: [3, 78, 139] },
    margin: { left: 14, right: 14 },
  });

  var yMetodos = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(13);
  doc.setTextColor(30);
  doc.text('Métodos de Pago', 14, yMetodos);

  doc.autoTable({
    startY: yMetodos + 4,
    head: [['Método', 'Cantidad']],
    body: [
      ['Efectivo', String(metodos.efectivo)],
      ['Tarjeta', String(metodos.tarjeta)],
      ['QR', String(metodos.qr)],
    ],
    theme: 'striped',
    headStyles: { fillColor: [3, 78, 139] },
    margin: { left: 14, right: 14 },
  });

  var yPedidos = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(13);
  doc.setTextColor(30);
  doc.text('Detalle de Pedidos', 14, yPedidos);

  doc.autoTable({
    startY: yPedidos + 4,
    head: [['ID', 'Monto', 'Estado', 'Fecha']],
    body: construirFilasPedidos(pedidos),
    theme: 'striped',
    headStyles: { fillColor: [3, 78, 139] },
    margin: { left: 14, right: 14 },
  });

  doc.save(nombreArchivo + '.pdf');

  if (window.showToast) {
    window.showToast('Reporte PDF descargado', { tipo: 'success' });
  }
}

function descargarExcel(
  pedidos,
  metodos,
  ingresos,
  devoluciones,
  fechaInicio,
  fechaFin,
  nombreArchivo,
) {
  var XLSX = window.XLSX;
  var wb = XLSX.utils.book_new();

  var resumenData = [
    ['REPORTE DE VENTAS'],
    ['Período:', fechaInicio + ' al ' + fechaFin],
    [],
    ['RESUMEN GENERAL'],
    ['Ingresos Totales', 'Bs. ' + ingresos.toFixed(2)],
    ['Total de Pedidos', pedidos.length],
    ['Devoluciones', devoluciones],
    [],
    ['MÉTODOS DE PAGO'],
    ['Efectivo', metodos.efectivo],
    ['Tarjeta', metodos.tarjeta],
    ['QR', metodos.qr],
  ];

  var wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
  wsResumen['!cols'] = [{ wch: 24 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

  var pedidosData = [['ID', 'Monto (Bs.)', 'Estado', 'Fecha']];
  pedidos.forEach(function (pedido) {
    pedidosData.push([
      pedido.id,
      (pedido.monto_total || 0).toFixed(2),
      pedido.estado || '',
      new Date(pedido.fecha_creacion).toLocaleDateString('es-BO'),
    ]);
  });

  var wsPedidos = XLSX.utils.aoa_to_sheet(pedidosData);
  wsPedidos['!cols'] = [{ wch: 36 }, { wch: 14 }, { wch: 16 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsPedidos, 'Pedidos');

  XLSX.writeFile(wb, nombreArchivo + '.xlsx');

  if (window.showToast) {
    window.showToast('Reporte Excel descargado', { tipo: 'success' });
  }
}

function descargarWord(
  pedidos,
  metodos,
  ingresos,
  devoluciones,
  fechaInicio,
  fechaFin,
  nombreArchivo,
) {
  var filasPedidos = pedidos
    .map(function (pedido) {
      var fecha = new Date(pedido.fecha_creacion).toLocaleDateString('es-BO');
      return (
        '<tr>' +
        '<td>' +
        pedido.id +
        '</td>' +
        '<td>Bs. ' +
        (pedido.monto_total || 0).toFixed(2) +
        '</td>' +
        '<td>' +
        (pedido.estado || '') +
        '</td>' +
        '<td>' +
        fecha +
        '</td>' +
        '</tr>'
      );
    })
    .join('');

  var html =
    '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
    '<style>' +
    'body { font-family: Arial, sans-serif; margin: 40px; }' +
    'h1 { color: #034e8b; }' +
    'h2 { color: #034e8b; margin-top: 24px; }' +
    'table { border-collapse: collapse; width: 100%; margin-top: 8px; }' +
    'th { background: #034e8b; color: white; padding: 8px 12px; text-align: left; }' +
    'td { padding: 7px 12px; border-bottom: 1px solid #e0e0e0; }' +
    'tr:nth-child(even) td { background: #f8f9fa; }' +
    '.periodo { color: #666; font-size: 13px; margin-bottom: 20px; }' +
    '</style></head><body>' +
    '<h1>Reporte de Ventas</h1>' +
    '<p class="periodo">Período: ' +
    fechaInicio +
    ' al ' +
    fechaFin +
    '</p>' +
    '<h2>Resumen General</h2>' +
    '<table><tr><th>Concepto</th><th>Valor</th></tr>' +
    '<tr><td>Ingresos Totales</td><td>Bs. ' +
    ingresos.toFixed(2) +
    '</td></tr>' +
    '<tr><td>Total de Pedidos</td><td>' +
    pedidos.length +
    '</td></tr>' +
    '<tr><td>Devoluciones</td><td>' +
    devoluciones +
    '</td></tr>' +
    '</table>' +
    '<h2>Métodos de Pago</h2>' +
    '<table><tr><th>Método</th><th>Cantidad</th></tr>' +
    '<tr><td>Efectivo</td><td>' +
    metodos.efectivo +
    '</td></tr>' +
    '<tr><td>Tarjeta</td><td>' +
    metodos.tarjeta +
    '</td></tr>' +
    '<tr><td>QR</td><td>' +
    metodos.qr +
    '</td></tr>' +
    '</table>' +
    '<h2>Detalle de Pedidos</h2>' +
    '<table><tr><th>ID</th><th>Monto</th><th>Estado</th><th>Fecha</th></tr>' +
    filasPedidos +
    '</table></body></html>';

  var blob = window.htmlDocx.asBlob(html);
  var enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(blob);
  enlace.download = nombreArchivo + '.docx';
  enlace.click();
  URL.revokeObjectURL(enlace.href);

  if (window.showToast) {
    window.showToast('Reporte Word descargado', { tipo: 'success' });
  }
}

function cargarAlertasStock(clienteSupabase) {
  var umbral = parseInt(document.getElementById('umbral-stock').value, 10) || 5;
  var tbody = document.getElementById('tabla-alertas-body');

  clienteSupabase
    .from('productos')
    .select('id, nombre, stock_disponible')
    .lte('stock_disponible', umbral)
    .order('stock_disponible', { ascending: true })
    .then(function (resultado) {
      var productos = resultado.data || [];

      while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
      }

      if (!productos.length) {
        var trVacio = document.createElement('tr');
        var tdVacio = document.createElement('td');
        tdVacio.className = 'panel-admin__tabla-td';
        tdVacio.colSpan = 4;
        tdVacio.textContent = 'No hay productos con stock bajo';
        trVacio.appendChild(tdVacio);
        tbody.appendChild(trVacio);
        return;
      }

      productos.forEach(function (producto) {
        var tr = document.createElement('tr');

        var tdNombre = document.createElement('td');
        tdNombre.className = 'panel-admin__tabla-td';
        tdNombre.textContent = producto.nombre;
        tr.appendChild(tdNombre);

        var tdStock = document.createElement('td');
        tdStock.className = 'panel-admin__tabla-td';
        tdStock.textContent = producto.stock_disponible || 0;
        tr.appendChild(tdStock);

        var tdNivel = document.createElement('td');
        tdNivel.className = 'panel-admin__tabla-td';
        var spanNivel = document.createElement('span');
        var stock = producto.stock_disponible || 0;
        if (stock <= 0) {
          spanNivel.className =
            'panel-admin__estado panel-admin__estado--agotado';
          spanNivel.textContent = 'Agotado';
        } else if (stock <= Math.floor(umbral / 2)) {
          spanNivel.className =
            'panel-admin__estado panel-admin__estado--critico';
          spanNivel.textContent = 'Crítico';
        } else {
          spanNivel.className = 'panel-admin__estado panel-admin__estado--bajo';
          spanNivel.textContent = 'Bajo';
        }
        tdNivel.appendChild(spanNivel);
        tr.appendChild(tdNivel);

        var tdAccion = document.createElement('td');
        tdAccion.className = 'panel-admin__tabla-td';
        var btnReabastecer = document.createElement('button');
        btnReabastecer.className =
          'panel-admin__boton panel-admin__boton--primario panel-admin__boton--pequeno';
        btnReabastecer.textContent = 'Reabastecer';
        btnReabastecer.addEventListener('click', function () {
          var nuevaCantidad = prompt(
            'Ingresa la nueva cantidad de stock para "' +
              producto.nombre +
              '":',
            '',
          );
          if (nuevaCantidad === null) return;
          var cantidad = parseInt(nuevaCantidad, 10);
          if (isNaN(cantidad) || cantidad < 0) {
            if (window.showToast) {
              window.showToast('Cantidad inválida', { tipo: 'warning' });
            }
            return;
          }
          actualizarStock(clienteSupabase, producto.id, cantidad);
        });
        tdAccion.appendChild(btnReabastecer);
        tr.appendChild(tdAccion);

        tbody.appendChild(tr);
      });
    });
}

function configurarAlertasUI(clienteSupabase) {
  var btnActualizar = document.getElementById('btn-actualizar-alertas');
  btnActualizar.addEventListener('click', function () {
    cargarAlertasStock(clienteSupabase);
  });
}

var mapaRutaInstancia = null;

function configurarMonitoreoRutas(clienteSupabase) {
  cargarListaChoferes(clienteSupabase);

  var inputFechaRuta = document.getElementById('fecha-ruta');
  var hoyStr = new Date().toISOString().split('T')[0];
  if (inputFechaRuta) {
    inputFechaRuta.setAttribute('max', hoyStr);
    inputFechaRuta.value = hoyStr;
  }

  var btnConsultar = document.getElementById('btn-consultar-ruta');
  btnConsultar.addEventListener('click', function () {
    var choferId = document.getElementById('seleccion-chofer').value;
    var fechaRuta = document.getElementById('fecha-ruta').value;

    if (!choferId) {
      if (window.showToast) {
        window.showToast('Selecciona un chofer', { tipo: 'warning' });
      }
      return;
    }

    if (!fechaRuta) {
      if (window.showToast) {
        window.showToast('Selecciona una fecha', { tipo: 'warning' });
      }
      return;
    }

    consultarRutaChofer(clienteSupabase, choferId, fechaRuta);
  });
}

function cargarListaChoferes(clienteSupabase) {
  var selectChofer = document.getElementById('seleccion-chofer');
  if (!selectChofer) return;

  clienteSupabase
    .from('usuarios')
    .select('id, nombre_completo')
    .eq('rol', 'chofer')
    .order('nombre_completo')
    .then(function (resultado) {
      var choferes = resultado.data || [];

      while (selectChofer.options.length > 1) {
        selectChofer.remove(1);
      }

      choferes.forEach(function (chofer) {
        var opcion = document.createElement('option');
        opcion.value = chofer.id;
        opcion.textContent = chofer.nombre_completo;
        selectChofer.appendChild(opcion);
      });
    });
}

function consultarRutaChofer(clienteSupabase, choferId, fechaRuta) {
  var fechaInicio = fechaRuta + 'T00:00:00';
  var fechaFin = fechaRuta + 'T23:59:59';

  clienteSupabase
    .from('envios')
    .select('id, pedido_id, fecha_asignacion')
    .eq('chofer_id', choferId)
    .then(function (resultadoEnvios) {
      var envios = resultadoEnvios.data || [];

      if (!envios.length) {
        if (window.showToast) {
          window.showToast('Este chofer no tiene envíos registrados', {
            tipo: 'info',
          });
        }
        document.getElementById('contenedor-mapa-ruta').style.display = 'none';
        document.getElementById('contenedor-entregas-chofer').style.display =
          'none';
        return;
      }

      var envioIds = envios.map(function (e) {
        return e.id;
      });

      Promise.all([
        clienteSupabase
          .from('historial_ubicaciones')
          .select('envio_id, latitud, longitud, fecha_registro')
          .in('envio_id', envioIds)
          .gte('fecha_registro', fechaInicio)
          .lte('fecha_registro', fechaFin)
          .order('fecha_registro', { ascending: true }),
        clienteSupabase
          .from('pedidos')
          .select(
            'id, direccion_destino, estado, fecha_entrega_final, usuario_id',
          )
          .in(
            'id',
            envios.map(function (e) {
              return e.pedido_id;
            }),
          ),
      ]).then(function (resultados) {
        var ubicaciones = resultados[0].data || [];
        var pedidos = resultados[1].data || [];

        renderizarMapaRuta(ubicaciones);
        cargarDetalleEntregasChofer(
          clienteSupabase,
          pedidos,
          envios,
          fechaRuta,
        );
      });
    });
}

function renderizarMapaRuta(ubicaciones) {
  var contenedorMapa = document.getElementById('contenedor-mapa-ruta');

  if (!ubicaciones.length) {
    contenedorMapa.style.display = 'none';
    if (window.showToast) {
      window.showToast('No hay registros GPS para esta fecha', {
        tipo: 'info',
      });
    }
    return;
  }

  contenedorMapa.style.display = 'block';

  if (mapaRutaInstancia) {
    mapaRutaInstancia.remove();
    mapaRutaInstancia = null;
  }

  var primerPunto = ubicaciones[0];
  mapaRutaInstancia = L.map('mapa-ruta').setView(
    [parseFloat(primerPunto.latitud), parseFloat(primerPunto.longitud)],
    14,
  );

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(mapaRutaInstancia);

  var coordenadas = ubicaciones.map(function (u) {
    return [parseFloat(u.latitud), parseFloat(u.longitud)];
  });

  L.polyline(coordenadas, { color: '#034e8b', weight: 4 }).addTo(
    mapaRutaInstancia,
  );

  var iconoInicio = L.divIcon({
    className: 'panel-admin__marcador-inicio',
    html: '<div style="background:#2e7d32;color:white;padding:4px 8px;border-radius:6px;font-size:12px;font-weight:600;white-space:nowrap;">Inicio</div>',
    iconSize: [50, 24],
  });

  var iconoFin = L.divIcon({
    className: 'panel-admin__marcador-fin',
    html: '<div style="background:#c62828;color:white;padding:4px 8px;border-radius:6px;font-size:12px;font-weight:600;white-space:nowrap;">Fin</div>',
    iconSize: [50, 24],
  });

  L.marker(coordenadas[0], { icon: iconoInicio }).addTo(mapaRutaInstancia);
  L.marker(coordenadas[coordenadas.length - 1], { icon: iconoFin }).addTo(
    mapaRutaInstancia,
  );

  coordenadas.forEach(function (coord, indice) {
    var hora = new Date(ubicaciones[indice].fecha_registro).toLocaleTimeString(
      'es-BO',
    );
    L.circleMarker(coord, {
      radius: 5,
      color: '#034e8b',
      fillColor: '#034e8b',
      fillOpacity: 0.7,
    })
      .bindPopup('Punto ' + (indice + 1) + ' - ' + hora)
      .addTo(mapaRutaInstancia);
  });

  var grupo = L.latLngBounds(coordenadas);
  mapaRutaInstancia.fitBounds(grupo, { padding: [30, 30] });
}

function cargarDetalleEntregasChofer(
  clienteSupabase,
  pedidos,
  envios,
  fechaRuta,
) {
  var contenedor = document.getElementById('contenedor-entregas-chofer');
  var tbody = document.getElementById('tabla-entregas-chofer-body');

  var mapaEnvios = {};
  envios.forEach(function (e) {
    mapaEnvios[e.pedido_id] = e;
  });

  var pedidosFiltrados = pedidos.filter(function (p) {
    if (!p.fecha_entrega_final) return false;
    var fechaEntrega = p.fecha_entrega_final.split('T')[0];
    return fechaEntrega === fechaRuta;
  });

  if (!pedidosFiltrados.length && !pedidos.length) {
    contenedor.style.display = 'none';
    return;
  }

  var pedidosMostrar = pedidosFiltrados.length ? pedidosFiltrados : pedidos;
  contenedor.style.display = 'block';

  var usuarioIds = pedidosMostrar.map(function (p) {
    return p.usuario_id;
  });

  clienteSupabase
    .from('usuarios')
    .select('id, nombre_completo')
    .in('id', usuarioIds)
    .then(function (resultadoUsuarios) {
      var usuarios = resultadoUsuarios.data || [];
      var mapaUsuarios = {};
      usuarios.forEach(function (u) {
        mapaUsuarios[u.id] = u.nombre_completo;
      });

      while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
      }

      pedidosMostrar.forEach(function (pedido) {
        var tr = document.createElement('tr');

        var tdPedido = document.createElement('td');
        tdPedido.className = 'panel-admin__tabla-td';
        tdPedido.textContent = '#' + pedido.id;
        tr.appendChild(tdPedido);

        var tdCliente = document.createElement('td');
        tdCliente.className = 'panel-admin__tabla-td';
        tdCliente.textContent =
          mapaUsuarios[pedido.usuario_id] || 'Desconocido';
        tr.appendChild(tdCliente);

        var tdDireccion = document.createElement('td');
        tdDireccion.className = 'panel-admin__tabla-td';
        tdDireccion.textContent = pedido.direccion_destino || 'Sin dirección';
        tr.appendChild(tdDireccion);

        var tdHora = document.createElement('td');
        tdHora.className = 'panel-admin__tabla-td';
        if (pedido.fecha_entrega_final) {
          tdHora.textContent = new Date(
            pedido.fecha_entrega_final,
          ).toLocaleTimeString('es-BO');
        } else {
          tdHora.textContent = 'Pendiente';
        }
        tr.appendChild(tdHora);

        var tdEstado = document.createElement('td');
        tdEstado.className = 'panel-admin__tabla-td';
        var spanEstado = document.createElement('span');
        var claseEstadoMod = (pedido.estado || '').replace(/\s+/g, '-');
        spanEstado.className =
          'panel-admin__estado panel-admin__estado--' + claseEstadoMod;
        spanEstado.textContent = pedido.estado || '';
        tdEstado.appendChild(spanEstado);
        tr.appendChild(tdEstado);

        tbody.appendChild(tr);
      });
    });
}
