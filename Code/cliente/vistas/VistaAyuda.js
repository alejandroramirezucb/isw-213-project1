class VistaAyuda {
  constructor() {
    this._bindFAQ();
    this._bindFormulario();
  }

  _bindFAQ() {
    document.querySelectorAll('.faq__boton-pestana').forEach((boton) => {
      boton.addEventListener('click', () => {
        document.querySelectorAll('.faq__boton-pestana').forEach((b) => b.classList.remove('faq__boton-pestana--activo'));
        document.querySelectorAll('.faq__panel').forEach((panel) => panel.classList.remove('faq__panel--activo'));
        boton.classList.add('faq__boton-pestana--activo');
        const panel = document.getElementById(`faq-${boton.dataset.panel}`);
        panel?.classList.add('faq__panel--activo');
      });
    });

    document.querySelectorAll('.faq__pregunta').forEach((pregunta) => {
      pregunta.addEventListener('click', () => {
        const item = pregunta.closest('.faq__item');
        const estaAbierto = item.classList.contains('faq__item--abierto');
        document.querySelectorAll('.faq__item--abierto').forEach((a) => a.classList.remove('faq__item--abierto'));
        if (!estaAbierto) item.classList.add('faq__item--abierto');
      });
    });
  }

  _bindFormulario() {
    const formulario = document.getElementById('formulario-contacto');
    if (!formulario) return;

    formulario.addEventListener('submit', (e) => {
      e.preventDefault();

      const nombre = document.getElementById('contacto-nombre')?.value.trim();
      const email = document.getElementById('contacto-email')?.value.trim();
      const categoria = document.getElementById('contacto-categoria')?.value;
      const mensaje = document.getElementById('contacto-mensaje')?.value.trim();

      if (!nombre || !email || !categoria || !mensaje) {
        if (window.showToast) window.showToast('Por favor completa todos los campos.', { tipo: 'error' });
        return;
      }

      const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!regexEmail.test(email)) {
        if (window.showToast) window.showToast('Ingresa un correo electrónico válido.', { tipo: 'error' });
        return;
      }

      document.dispatchEvent(new CustomEvent('ayuda:formularioEnviado', {
        detail: { nombre, email, categoria, mensaje },
      }));
    });
  }

  bloquearBoton() {
    const boton = document.querySelector('.contacto__boton');
    if (boton) { boton.disabled = true; boton.textContent = 'Enviando...'; }
  }

  desbloquearBoton() {
    const boton = document.querySelector('.contacto__boton');
    if (boton) { boton.disabled = false; boton.textContent = 'Enviar mensaje'; }
  }

  resetearFormulario() {
    document.getElementById('formulario-contacto')?.reset();
  }

  renderizarConsultas(consultas) {
    const contenedor = document.getElementById('lista-mis-consultas');
    if (!contenedor) return;

    const seccion = document.getElementById('seccion-mis-consultas');

    if (!consultas || consultas.length === 0) {
      contenedor.innerHTML = '<p class="consultas__vacio">Aún no has enviado ninguna consulta.</p>';
      return;
    }

    if (seccion) seccion.style.display = 'block';

    while (contenedor.firstChild) contenedor.removeChild(contenedor.firstChild);

    const lista = document.createElement('div');
    lista.className = 'consultas__lista';

    consultas.forEach((c) => {
      const fecha = new Date(c.fecha_creacion).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
      const estadoClase = c.estado === 'respondido' ? 'consulta__estado--respondido' : 'consulta__estado--pendiente';
      const estadoTexto = c.estado === 'respondido' ? 'Respondido' : 'Pendiente';

      const tarjeta = document.createElement('div');
      tarjeta.className = 'consulta__tarjeta';

      const encabezado = document.createElement('div');
      encabezado.className = 'consulta__encabezado';

      const spanCategoria = document.createElement('span');
      spanCategoria.className = 'consulta__categoria';
      spanCategoria.textContent = c.categoria || '';
      encabezado.appendChild(spanCategoria);

      const spanFecha = document.createElement('span');
      spanFecha.className = 'consulta__fecha';
      spanFecha.textContent = fecha;
      encabezado.appendChild(spanFecha);

      tarjeta.appendChild(encabezado);

      const spanEstado = document.createElement('span');
      spanEstado.className = estadoClase;
      spanEstado.textContent = estadoTexto;
      tarjeta.appendChild(spanEstado);

      const pMensaje = document.createElement('p');
      pMensaje.className = 'consulta__mensaje';
      pMensaje.textContent = c.mensaje;
      tarjeta.appendChild(pMensaje);

      if (c.respuesta_admin) {
        const fechaResp = c.fecha_respuesta ? new Date(c.fecha_respuesta).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
        const divResp = document.createElement('div');
        divResp.className = 'consulta__respuesta';

        const pTitulo = document.createElement('p');
        pTitulo.className = 'consulta__respuesta-titulo';
        pTitulo.textContent = `Respuesta del equipo${fechaResp ? ` – ${fechaResp}` : ''}`;
        divResp.appendChild(pTitulo);

        const pRespuesta = document.createElement('p');
        pRespuesta.textContent = c.respuesta_admin;
        divResp.appendChild(pRespuesta);

        tarjeta.appendChild(divResp);
      }

      lista.appendChild(tarjeta);
    });

    contenedor.appendChild(lista);
  }

  prefrellenarFormulario(email, nombre) {
    const campoEmail = document.getElementById('contacto-email');
    const campoNombre = document.getElementById('contacto-nombre');
    if (campoEmail && email) campoEmail.value = email;
    if (campoNombre && nombre) campoNombre.value = nombre;
  }

  mostrarConsultas(mostrar) {
    const seccion = document.getElementById('seccion-mis-consultas');
    if (seccion) seccion.style.display = mostrar ? 'block' : 'none';
  }
}

export default VistaAyuda;
