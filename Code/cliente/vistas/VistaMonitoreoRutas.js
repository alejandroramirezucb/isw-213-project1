class VistaMonitoreoRutas {
  constructor(clienteSupabase) {
    this._supabase = clienteSupabase;
    this._mapaInstancia = null;
    this._bindControles();
  }

  _bindControles() {
    const hoyStr = new Date().toISOString().split('T')[0];
    const inputFechaRuta = document.getElementById('fecha-ruta');
    if (inputFechaRuta) {
      inputFechaRuta.setAttribute('max', hoyStr);
      inputFechaRuta.value = hoyStr;
    }

    this._cargarSelectChoferes();

    document.getElementById('btn-consultar-ruta')?.addEventListener('click', () => {
      const choferId = document.getElementById('seleccion-chofer')?.value;
      const fechaRuta = document.getElementById('fecha-ruta')?.value;

      if (!choferId) { if (window.showToast) window.showToast('Selecciona un chofer', { tipo: 'warning' }); return; }
      if (!fechaRuta) { if (window.showToast) window.showToast('Selecciona una fecha', { tipo: 'warning' }); return; }

      document.dispatchEvent(new CustomEvent('ruta:consultarSolicitada', { detail: { choferId, fechaRuta } }));
    });
  }

  async _cargarSelectChoferes() {
    const selectChofer = document.getElementById('seleccion-chofer');
    if (!selectChofer) return;

    const { data: choferes } = await this._supabase
      .from('usuarios')
      .select('id, nombre_completo')
      .eq('rol', 'chofer')
      .order('nombre_completo');

    while (selectChofer.options.length > 1) selectChofer.remove(1);
    (choferes || []).forEach((chofer) => {
      const opcion = document.createElement('option');
      opcion.value = chofer.id;
      opcion.textContent = chofer.nombre_completo;
      selectChofer.appendChild(opcion);
    });
  }

  renderizarMapa(ubicaciones) {
    const contenedorMapa = document.getElementById('contenedor-mapa-ruta');
    if (!contenedorMapa) return;

    if (!ubicaciones.length) {
      contenedorMapa.style.display = 'none';
      if (window.showToast) window.showToast('No hay registros GPS para esta fecha', { tipo: 'info' });
      return;
    }

    contenedorMapa.style.display = 'block';

    if (this._mapaInstancia) { this._mapaInstancia.remove(); this._mapaInstancia = null; }

    const primer = ubicaciones[0];
    this._mapaInstancia = L.map('mapa-ruta').setView([parseFloat(primer.latitud), parseFloat(primer.longitud)], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(this._mapaInstancia);

    const coords = ubicaciones.map((u) => [parseFloat(u.latitud), parseFloat(u.longitud)]);
    L.polyline(coords, { color: '#034e8b', weight: 4 }).addTo(this._mapaInstancia);

    const iconoInicio = L.divIcon({ className: 'panel-admin__marcador-inicio', html: '<div style="background:#2e7d32;color:white;padding:4px 8px;border-radius:6px;font-size:12px;font-weight:600;white-space:nowrap;">Inicio</div>', iconSize: [50, 24] });
    const iconoFin = L.divIcon({ className: 'panel-admin__marcador-fin', html: '<div style="background:#c62828;color:white;padding:4px 8px;border-radius:6px;font-size:12px;font-weight:600;white-space:nowrap;">Fin</div>', iconSize: [50, 24] });

    L.marker(coords[0], { icon: iconoInicio }).addTo(this._mapaInstancia);
    L.marker(coords[coords.length - 1], { icon: iconoFin }).addTo(this._mapaInstancia);

    coords.forEach((coord, i) => {
      const hora = new Date(ubicaciones[i].fecha_registro).toLocaleTimeString('es-BO');
      L.circleMarker(coord, { radius: 5, color: '#034e8b', fillColor: '#034e8b', fillOpacity: 0.7 })
        .bindPopup(`Punto ${i + 1} - ${hora}`)
        .addTo(this._mapaInstancia);
    });

    this._mapaInstancia.fitBounds(L.latLngBounds(coords), { padding: [30, 30] });
  }

  renderizarTablaEntregas(pedidos, mapaEnvios, mapaUsuarios, fechaRuta) {
    const contenedor = document.getElementById('contenedor-entregas-chofer');
    const tbody = document.getElementById('tabla-entregas-chofer-body');
    if (!tbody) return;

    const pedidosFiltrados = pedidos.filter((p) => p.fecha_entrega_final && p.fecha_entrega_final.split('T')[0] === fechaRuta);
    const pedidosMostrar = pedidosFiltrados.length ? pedidosFiltrados : pedidos;

    if (!pedidosMostrar.length) { if (contenedor) contenedor.style.display = 'none'; return; }
    if (contenedor) contenedor.style.display = 'block';

    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    pedidosMostrar.forEach((pedido) => {
      const tr = document.createElement('tr');
      const claseEstadoMod = (pedido.estado || '').replace(/\s+/g, '-');

      [
        `#${pedido.id}`,
        mapaUsuarios[pedido.usuario_id] || 'Desconocido',
        pedido.direccion_destino || 'Sin dirección',
        pedido.fecha_entrega_final ? new Date(pedido.fecha_entrega_final).toLocaleTimeString('es-BO') : 'Pendiente',
      ].forEach((texto) => {
        const td = document.createElement('td');
        td.className = 'panel-admin__tabla-td';
        td.textContent = texto;
        tr.appendChild(td);
      });

      const tdEstado = document.createElement('td');
      tdEstado.className = 'panel-admin__tabla-td';
      const spanEstado = document.createElement('span');
      spanEstado.className = `panel-admin__estado panel-admin__estado--${claseEstadoMod}`;
      spanEstado.textContent = pedido.estado || '';
      tdEstado.appendChild(spanEstado);
      tr.appendChild(tdEstado);

      tbody.appendChild(tr);
    });
  }
}

export default VistaMonitoreoRutas;
