class Toaster {
  constructor() {
    this._idContenedor = 'contenedor-notificaciones';
  }

  _asegurarContenedor() {
    let contenedor = document.getElementById(this._idContenedor);
    if (!contenedor) {
      contenedor = document.createElement('div');
      contenedor.id = this._idContenedor;
      contenedor.className = 'toaster-contenedor';
      document.body.appendChild(contenedor);
    }
    return contenedor;
  }

  _crearElemento(mensaje, { tipo = 'info', textoAccion, accion } = {}) {
    const elemento = document.createElement('div');
    elemento.className = `notificacion-emergente notificacion-emergente--${tipo}`;

    const divMensaje = document.createElement('div');
    divMensaje.className = 'notificacion-emergente__mensaje';
    divMensaje.innerText = mensaje;
    elemento.appendChild(divMensaje);

    const divAcciones = document.createElement('div');
    divAcciones.className = 'notificacion-emergente__acciones';

    const eliminar = () => {
      elemento.classList.remove('notificacion-emergente--visible');
      setTimeout(() => elemento.remove(), 300);
    };

    if (textoAccion && typeof accion === 'function') {
      const btnAccion = document.createElement('button');
      btnAccion.className = 'notificacion-emergente__boton notificacion-emergente__boton--accion';
      btnAccion.innerText = textoAccion;
      btnAccion.addEventListener('click', () => { accion(); eliminar(); });
      divAcciones.appendChild(btnAccion);
    }

    const btnCerrar = document.createElement('button');
    btnCerrar.className = 'notificacion-emergente__boton notificacion-emergente__boton--cerrar';
    btnCerrar.innerText = '✕';
    btnCerrar.addEventListener('click', eliminar);
    divAcciones.appendChild(btnCerrar);

    elemento.appendChild(divAcciones);
    return { elemento, eliminar };
  }

  mostrar(mensaje, opciones = {}) {
    const tipo = opciones.type || opciones.tipo || 'info';
    const duracion = opciones.duration || opciones.duracion || 4000;
    const textoAccion = opciones.actionText || opciones.textoAccion;
    const accion = opciones.action || opciones.accion;
    const persistente = opciones.persistent || opciones.persistente || false;

    const contenedor = this._asegurarContenedor();
    const { elemento, eliminar } = this._crearElemento(mensaje, { tipo, textoAccion, accion });

    contenedor.appendChild(elemento);
    requestAnimationFrame(() => elemento.classList.add('notificacion-emergente--visible'));

    if (!persistente && duracion > 0) setTimeout(eliminar, duracion);
    return { eliminar };
  }

  confirmar(mensaje, opciones = {}) {
    const textoConfirmar = opciones.confirmText || opciones.textoConfirmar || 'Confirmar';
    const textoCancelar = opciones.cancelText || opciones.textoCancelar || 'Cancelar';
    const tipo = opciones.type || opciones.tipo || 'warning';

    return new Promise((resolver) => {
      const contenedor = this._asegurarContenedor();
      const elemento = document.createElement('div');
      elemento.className = `notificacion-emergente notificacion-emergente--${tipo} notificacion-emergente--confirmar`;

      const divMensaje = document.createElement('div');
      divMensaje.className = 'notificacion-emergente__mensaje';
      divMensaje.innerText = mensaje;
      elemento.appendChild(divMensaje);

      const divAcciones = document.createElement('div');
      divAcciones.className = 'notificacion-emergente__acciones';

      const cerrar = () => {
        elemento.classList.remove('notificacion-emergente--visible');
        setTimeout(() => elemento.remove(), 200);
      };

      const btnCancelar = document.createElement('button');
      btnCancelar.className = 'notificacion-emergente__boton notificacion-emergente__boton--cancelar';
      btnCancelar.innerText = textoCancelar;
      btnCancelar.addEventListener('click', () => { cerrar(); resolver(false); });

      const btnAceptar = document.createElement('button');
      btnAceptar.className = 'notificacion-emergente__boton notificacion-emergente__boton--aceptar';
      btnAceptar.innerText = textoConfirmar;
      btnAceptar.addEventListener('click', () => { cerrar(); resolver(true); });

      divAcciones.appendChild(btnCancelar);
      divAcciones.appendChild(btnAceptar);
      elemento.appendChild(divAcciones);

      contenedor.appendChild(elemento);
      requestAnimationFrame(() => elemento.classList.add('notificacion-emergente--visible'));
    });
  }
}

const toaster = new Toaster();

window.showToast = (msg, opts) => toaster.mostrar(msg, opts);
window.showConfirm = (msg, opts) => toaster.confirmar(msg, opts);

export default Toaster;
export const showToast = (msg, opts) => toaster.mostrar(msg, opts);
export const showConfirm = (msg, opts) => toaster.confirmar(msg, opts);
