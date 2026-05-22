class VistaPerfil {
  constructor() {
    document.addEventListener('usuario:cargado', (e) => this._renderizarPerfil(e.detail.usuario));
    document.addEventListener('usuario:pedidosCargados', (e) => this._renderizarPedidos(e.detail.pedidos));
  }

  _renderizarPerfil(usuario) {
    const nombre = usuario.nombre || usuario.nombre_completo || '';
    const elem = (id) => document.getElementById(id);

    if (elem('user-nombre')) elem('user-nombre').textContent = nombre;
    if (elem('user-email')) elem('user-email').textContent = usuario.correo_electronico || '';
    if (elem('user-avatar')) elem('user-avatar').textContent = nombre.charAt(0).toUpperCase();
    if (elem('user-telefono') && usuario.telefono) elem('user-telefono').textContent = usuario.telefono;
    if (elem('user-rol') && usuario.rol) {
      const rolTextos = { administrador: 'Administrador', chofer: 'Chofer', cliente: 'Cliente' };
      elem('user-rol').textContent = rolTextos[usuario.rol] || 'Cliente';
    }
  }

  _renderizarPedidos(pedidos) {
    const contenedor = document.getElementById('lista-pedidos');
    if (!contenedor) return;

    while (contenedor.firstChild) contenedor.removeChild(contenedor.firstChild);

    if (!pedidos || pedidos.length === 0) {
      const p = document.createElement('p');
      p.style.cssText = 'color: #888; text-align: center; padding: 20px;';
      p.textContent = 'No tienes pedidos aún';
      contenedor.appendChild(p);
      return;
    }

    pedidos.forEach((pedido) => {
      const div = document.createElement('div');
      div.className = 'item-pedido';

      const divInfo = document.createElement('div');
      divInfo.className = 'pedido-info';

      const spanId = document.createElement('span');
      spanId.className = 'pedido-id';
      spanId.textContent = `Pedido #${pedido.id}`;
      divInfo.appendChild(spanId);

      const fecha = new Date(pedido.fecha_creacion).toLocaleDateString('es-BO');
      const spanFecha = document.createElement('span');
      spanFecha.className = 'pedido-fecha';
      spanFecha.textContent = `${fecha} - Bs. ${pedido.monto_total.toFixed(2)}`;
      divInfo.appendChild(spanFecha);

      div.appendChild(divInfo);

      const divEstado = document.createElement('div');
      divEstado.className = `pedido-estado estado-${pedido.estado.replace(/ /g, '-')}`;
      divEstado.textContent = this._etiquetaEstado(pedido.estado);
      div.appendChild(divEstado);

      contenedor.appendChild(div);
    });
  }

  _etiquetaEstado(estado) {
    if (!estado) return '';
    if (estado === 'orden realizada') return 'Orden Realizada';
    if (estado === 'recibido') return 'Recibido';
    return estado.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

export default VistaPerfil;
