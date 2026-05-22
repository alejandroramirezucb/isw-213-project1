class VistaEntregasChofer {
  constructor() {
    document.addEventListener('entrega:listaCargada', (e) => this._renderizar(e.detail));
  }

  _renderizar({ tipo, pedidos, mapaEnvios }) {
    const contenedores = { pendiente: 'lista-pendientes', 'en-curso': 'lista-en-curso', completada: 'lista-completadas' };
    const contenedor = document.getElementById(contenedores[tipo]);
    if (!contenedor) return;

    while (contenedor.firstChild) contenedor.removeChild(contenedor.firstChild);

    if (!pedidos || pedidos.length === 0) {
      const mensajes = { pendiente: 'No tienes entregas pendientes', 'en-curso': 'No tienes entregas en curso', completada: 'No tienes entregas completadas' };
      const p = document.createElement('p');
      p.className = 'panel-chofer__vacio';
      p.textContent = mensajes[tipo];
      contenedor.appendChild(p);
      return;
    }

    pedidos.forEach((pedido) => {
      const envio = mapaEnvios[pedido.id] || {};
      contenedor.appendChild(this._crearTarjeta(pedido, envio, tipo));
    });
  }

  _crearTarjeta(pedido, envio, tipo) {
    const tarjeta = document.createElement('article');
    tarjeta.className = 'panel-chofer__tarjeta';

    const cabecera = document.createElement('div');
    cabecera.className = 'panel-chofer__tarjeta-cabecera';

    const spanId = document.createElement('span');
    spanId.className = 'panel-chofer__pedido-id';
    spanId.textContent = `Pedido #${pedido.id}`;
    cabecera.appendChild(spanId);

    const claseEstado = this._claseEstado(pedido.estado);
    const spanEstado = document.createElement('span');
    spanEstado.className = `panel-chofer__estado ${claseEstado}`;
    spanEstado.textContent = this._formatearEstado(pedido.estado);
    cabecera.appendChild(spanEstado);

    if (tipo === 'en-curso') {
      const spanGps = document.createElement('span');
      spanGps.className = 'panel-chofer__gps-activo';
      const punto = document.createElement('span');
      punto.className = 'panel-chofer__gps-punto';
      spanGps.appendChild(punto);
      spanGps.appendChild(document.createTextNode(' GPS Activo'));
      cabecera.appendChild(spanGps);
    }

    tarjeta.appendChild(cabecera);

    const cuerpo = document.createElement('div');
    cuerpo.className = 'panel-chofer__tarjeta-cuerpo';

    this._agregarLinea(cuerpo, 'Cliente', pedido.nombre_cliente || 'Desconocido');
    this._agregarLinea(cuerpo, 'Dirección', pedido.direccion_destino || 'Sin dirección');
    this._agregarLinea(cuerpo, 'Monto', `Bs. ${(pedido.monto_total || 0).toFixed(2)}`);
    this._agregarLinea(cuerpo, 'Fecha', new Date(pedido.fecha_creacion).toLocaleDateString('es-BO'));

    if (tipo === 'completada' && pedido.fecha_entrega_final) {
      this._agregarLinea(cuerpo, 'Entregado', new Date(pedido.fecha_entrega_final).toLocaleString('es-BO'));
    }

    if (tipo === 'completada' && envio.foto_evidencia_url) {
      const divEvidencia = document.createElement('div');
      divEvidencia.className = 'panel-chofer__info-linea';
      const spanEtiqueta = document.createElement('span');
      spanEtiqueta.className = 'panel-chofer__info-etiqueta';
      spanEtiqueta.textContent = 'Evidencia:';
      divEvidencia.appendChild(spanEtiqueta);
      const imgEvidencia = document.createElement('img');
      imgEvidencia.src = envio.foto_evidencia_url;
      imgEvidencia.alt = 'Evidencia de entrega';
      imgEvidencia.className = 'panel-chofer__evidencia-img';
      divEvidencia.appendChild(imgEvidencia);
      cuerpo.appendChild(divEvidencia);
    }

    tarjeta.appendChild(cuerpo);

    const acciones = document.createElement('div');
    acciones.className = 'panel-chofer__tarjeta-acciones';

    if (tipo === 'pendiente') {
      const btnIniciar = document.createElement('button');
      btnIniciar.className = 'panel-chofer__boton panel-chofer__boton--primario';
      btnIniciar.textContent = 'Iniciar Entrega';
      btnIniciar.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('entrega:iniciarSolicitada', { detail: { pedidoId: pedido.id, envioId: envio.id } }));
      });
      acciones.appendChild(btnIniciar);
    }

    if (tipo === 'en-curso') {
      if (pedido.estado === 'trasladandose') {
        const btnLlegue = document.createElement('button');
        btnLlegue.className = 'panel-chofer__boton panel-chofer__boton--advertencia';
        btnLlegue.textContent = 'Llegué al destino';
        btnLlegue.addEventListener('click', () => {
          document.dispatchEvent(new CustomEvent('entrega:llegadaSolicitada', { detail: { pedidoId: pedido.id, envioId: envio.id } }));
        });
        acciones.appendChild(btnLlegue);
      }

      if (pedido.estado === 'listo para entregarse') {
        const btnEntregar = document.createElement('button');
        btnEntregar.className = 'panel-chofer__boton panel-chofer__boton--exito';
        btnEntregar.textContent = 'Marcar Entregado';
        btnEntregar.addEventListener('click', () => {
          document.dispatchEvent(new CustomEvent('entrega:evidenciaSolicitada', { detail: { pedidoId: pedido.id, envioId: envio.id } }));
        });
        acciones.appendChild(btnEntregar);
      }
    }

    tarjeta.appendChild(acciones);
    return tarjeta;
  }

  _agregarLinea(contenedor, etiqueta, valor) {
    const div = document.createElement('div');
    div.className = 'panel-chofer__info-linea';
    const spanEtiqueta = document.createElement('span');
    spanEtiqueta.className = 'panel-chofer__info-etiqueta';
    spanEtiqueta.textContent = `${etiqueta}:`;
    div.appendChild(spanEtiqueta);
    const spanValor = document.createElement('span');
    spanValor.className = 'panel-chofer__info-valor';
    spanValor.textContent = valor;
    div.appendChild(spanValor);
    contenedor.appendChild(div);
  }

  _claseEstado(estado) {
    const mapa = { enviado: 'panel-chofer__estado--enviado', trasladandose: 'panel-chofer__estado--trasladandose', 'listo para entregarse': 'panel-chofer__estado--listo', entregado: 'panel-chofer__estado--entregado' };
    return mapa[estado] || '';
  }

  _formatearEstado(estado) {
    if (!estado) return '';
    return estado.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

export default VistaEntregasChofer;
