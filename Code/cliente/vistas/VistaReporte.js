class VistaReporte {
  constructor() {
    document.addEventListener('reporte:datosListos', (e) => this._renderizar(e.detail));
    this._bindFiltrosFecha();
  }

  _bindFiltrosFecha() {
    const hoyStr = new Date().toISOString().split('T')[0];
    const inputInicio = document.getElementById('reporte-fecha-inicio');
    const inputFin = document.getElementById('reporte-fecha-fin');

    if (inputInicio) {
      inputInicio.setAttribute('max', hoyStr);
      inputInicio.addEventListener('change', () => { if (inputInicio.value > hoyStr) inputInicio.value = hoyStr; });
    }
    if (inputFin) {
      inputFin.setAttribute('max', hoyStr);
      inputFin.addEventListener('change', () => { if (inputFin.value > hoyStr) inputFin.value = hoyStr; });
    }

    const btnGenerar = document.getElementById('btn-generar-reporte');
    btnGenerar?.addEventListener('click', () => {
      const fechaInicio = inputInicio?.value;
      const fechaFin = inputFin?.value;
      const formato = document.getElementById('reporte-formato')?.value;

      if (!fechaInicio || !fechaFin) {
        if (window.showToast) window.showToast('Selecciona un rango de fechas', { tipo: 'warning' });
        return;
      }
      if (fechaInicio > fechaFin) {
        if (window.showToast) window.showToast('La fecha de inicio no puede ser mayor a la de fin', { tipo: 'warning' });
        return;
      }
      if (fechaInicio > hoyStr || fechaFin > hoyStr) {
        if (window.showToast) window.showToast('No es posible generar reportes para fechas futuras', { tipo: 'warning' });
        return;
      }

      document.dispatchEvent(new CustomEvent('reporte:generarSolicitado', {
        detail: { fechaInicio, fechaFin, formato },
      }));
    });
  }

  _renderizar({ pedidos, metodos, ingresos, devoluciones }) {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('reporte-ingresos', `Bs. ${ingresos.toFixed(2)}`);
    set('reporte-pedidos', pedidos.length);
    set('reporte-devoluciones', devoluciones);

    this._renderizarGrafico(metodos);
    const resumen = document.getElementById('resumen-reporte');
    if (resumen) resumen.style.display = 'block';
  }

  _renderizarGrafico(metodos) {
    const contenedor = document.getElementById('grafico-metodos-pago');
    if (!contenedor) return;

    while (contenedor.firstChild) contenedor.removeChild(contenedor.firstChild);

    const total = (metodos.efectivo + metodos.tarjeta + metodos.qr) || 1;

    [
      { nombre: 'Efectivo', cantidad: metodos.efectivo, clase: 'panel-admin__barra-relleno--efectivo' },
      { nombre: 'Tarjeta', cantidad: metodos.tarjeta, clase: 'panel-admin__barra-relleno--tarjeta' },
      { nombre: 'QR', cantidad: metodos.qr, clase: 'panel-admin__barra-relleno--qr' },
    ].forEach((dato) => {
      const divBarra = document.createElement('div');
      divBarra.className = 'panel-admin__barra-grafico';

      const spanValor = document.createElement('span');
      spanValor.className = 'panel-admin__barra-valor';
      spanValor.textContent = dato.cantidad;
      divBarra.appendChild(spanValor);

      const divRelleno = document.createElement('div');
      divRelleno.className = `panel-admin__barra-relleno ${dato.clase}`;
      divRelleno.style.height = `${Math.max((dato.cantidad / total) * 100, 4)}%`;
      divBarra.appendChild(divRelleno);

      const spanLabel = document.createElement('span');
      spanLabel.className = 'panel-admin__barra-label';
      spanLabel.textContent = dato.nombre;
      divBarra.appendChild(spanLabel);

      contenedor.appendChild(divBarra);
    });
  }

  descargar(pedidos, pagos, metodos, ingresos, devoluciones, fechaInicio, fechaFin, formato) {
    const nombreArchivo = `reporte_${fechaInicio}_${fechaFin}`;
    if (formato === 'pdf') this._descargarPDF(pedidos, metodos, ingresos, devoluciones, fechaInicio, fechaFin, nombreArchivo);
    else if (formato === 'excel') this._descargarExcel(pedidos, metodos, ingresos, devoluciones, fechaInicio, fechaFin, nombreArchivo);
    else if (formato === 'doc') this._descargarWord(pedidos, metodos, ingresos, devoluciones, fechaInicio, fechaFin, nombreArchivo);
  }

  _descargarPDF(pedidos, metodos, ingresos, devoluciones, fechaInicio, fechaFin, nombreArchivo) {
    const jsPDF = window.jspdf.jsPDF;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(3, 78, 139);
    doc.text('Reporte de Ventas', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Período: ${fechaInicio} al ${fechaFin}`, 14, 28);

    doc.setFontSize(13);
    doc.setTextColor(30);
    doc.text('Resumen General', 14, 40);
    doc.autoTable({ startY: 44, head: [['Concepto', 'Valor']], body: [['Ingresos Totales', `Bs. ${ingresos.toFixed(2)}`], ['Total de Pedidos', String(pedidos.length)], ['Devoluciones', String(devoluciones)]], theme: 'striped', headStyles: { fillColor: [3, 78, 139] }, margin: { left: 14, right: 14 } });

    const yMetodos = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(13);
    doc.setTextColor(30);
    doc.text('Métodos de Pago', 14, yMetodos);
    doc.autoTable({ startY: yMetodos + 4, head: [['Método', 'Cantidad']], body: [['Efectivo', String(metodos.efectivo)], ['Tarjeta', String(metodos.tarjeta)], ['QR', String(metodos.qr)]], theme: 'striped', headStyles: { fillColor: [3, 78, 139] }, margin: { left: 14, right: 14 } });

    const yPedidos = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(13);
    doc.setTextColor(30);
    doc.text('Detalle de Pedidos', 14, yPedidos);
    doc.autoTable({ startY: yPedidos + 4, head: [['ID', 'Monto', 'Estado', 'Fecha']], body: pedidos.map((p) => [String(p.id), `Bs. ${(p.monto_total || 0).toFixed(2)}`, p.estado || '', new Date(p.fecha_creacion).toLocaleDateString('es-BO')]), theme: 'striped', headStyles: { fillColor: [3, 78, 139] }, margin: { left: 14, right: 14 } });

    doc.save(`${nombreArchivo}.pdf`);
    if (window.showToast) window.showToast('Reporte PDF descargado', { tipo: 'success' });
  }

  _descargarExcel(pedidos, metodos, ingresos, devoluciones, fechaInicio, fechaFin, nombreArchivo) {
    const XLSX = window.XLSX;
    const wb = XLSX.utils.book_new();

    const resumenData = [['REPORTE DE VENTAS'], ['Período:', `${fechaInicio} al ${fechaFin}`], [], ['RESUMEN GENERAL'], ['Ingresos Totales', `Bs. ${ingresos.toFixed(2)}`], ['Total de Pedidos', pedidos.length], ['Devoluciones', devoluciones], [], ['MÉTODOS DE PAGO'], ['Efectivo', metodos.efectivo], ['Tarjeta', metodos.tarjeta], ['QR', metodos.qr]];
    const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
    wsResumen['!cols'] = [{ wch: 24 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

    const pedidosData = [['ID', 'Monto (Bs.)', 'Estado', 'Fecha'], ...pedidos.map((p) => [p.id, (p.monto_total || 0).toFixed(2), p.estado || '', new Date(p.fecha_creacion).toLocaleDateString('es-BO')])];
    const wsPedidos = XLSX.utils.aoa_to_sheet(pedidosData);
    wsPedidos['!cols'] = [{ wch: 36 }, { wch: 14 }, { wch: 16 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, wsPedidos, 'Pedidos');

    XLSX.writeFile(wb, `${nombreArchivo}.xlsx`);
    if (window.showToast) window.showToast('Reporte Excel descargado', { tipo: 'success' });
  }

  _descargarWord(pedidos, metodos, ingresos, devoluciones, fechaInicio, fechaFin, nombreArchivo) {
    const filasPedidos = pedidos.map((p) => `<tr><td>${p.id}</td><td>Bs. ${(p.monto_total || 0).toFixed(2)}</td><td>${p.estado || ''}</td><td>${new Date(p.fecha_creacion).toLocaleDateString('es-BO')}</td></tr>`).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;margin:40px}h1,h2{color:#034e8b}table{border-collapse:collapse;width:100%;margin-top:8px}th{background:#034e8b;color:white;padding:8px 12px;text-align:left}td{padding:7px 12px;border-bottom:1px solid #e0e0e0}tr:nth-child(even) td{background:#f8f9fa}.periodo{color:#666;font-size:13px;margin-bottom:20px}</style></head><body><h1>Reporte de Ventas</h1><p class="periodo">Período: ${fechaInicio} al ${fechaFin}</p><h2>Resumen General</h2><table><tr><th>Concepto</th><th>Valor</th></tr><tr><td>Ingresos Totales</td><td>Bs. ${ingresos.toFixed(2)}</td></tr><tr><td>Total de Pedidos</td><td>${pedidos.length}</td></tr><tr><td>Devoluciones</td><td>${devoluciones}</td></tr></table><h2>Métodos de Pago</h2><table><tr><th>Método</th><th>Cantidad</th></tr><tr><td>Efectivo</td><td>${metodos.efectivo}</td></tr><tr><td>Tarjeta</td><td>${metodos.tarjeta}</td></tr><tr><td>QR</td><td>${metodos.qr}</td></tr></table><h2>Detalle de Pedidos</h2><table><tr><th>ID</th><th>Monto</th><th>Estado</th><th>Fecha</th></tr>${filasPedidos}</table></body></html>`;

    const blob = window.htmlDocx.asBlob(html);
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(blob);
    enlace.download = `${nombreArchivo}.docx`;
    enlace.click();
    URL.revokeObjectURL(enlace.href);
    if (window.showToast) window.showToast('Reporte Word descargado', { tipo: 'success' });
  }
}

export default VistaReporte;
