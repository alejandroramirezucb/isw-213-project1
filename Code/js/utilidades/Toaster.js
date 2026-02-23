(function () {
  var idContenedor = 'contenedor-notificaciones';

  function asegurarContenedor() {
    var contenedor = document.getElementById(idContenedor);
    if (!contenedor) {
      contenedor = document.createElement('div');
      contenedor.id = idContenedor;
      contenedor.className = 'toaster-contenedor';
      document.body.appendChild(contenedor);
    }
    return contenedor;
  }

  function crearElementoNotificacion(mensaje, opciones) {
    var tipo = opciones.tipo || 'info';
    var textoAccion = opciones.textoAccion;
    var accion = opciones.accion;

    var elemento = document.createElement('div');
    elemento.className =
      'notificacion-emergente notificacion-emergente--' + tipo;

    var divMensaje = document.createElement('div');
    divMensaje.className = 'notificacion-emergente__mensaje';
    divMensaje.innerText = mensaje;
    elemento.appendChild(divMensaje);

    var divAcciones = document.createElement('div');
    divAcciones.className = 'notificacion-emergente__acciones';

    if (textoAccion && typeof accion === 'function') {
      var botonAccion = document.createElement('button');
      botonAccion.className =
        'notificacion-emergente__boton notificacion-emergente__boton--accion';
      botonAccion.innerText = textoAccion;
      botonAccion.addEventListener('click', function () {
        accion();
        eliminar();
      });
      divAcciones.appendChild(botonAccion);
    }

    var botonCerrar = document.createElement('button');
    botonCerrar.className =
      'notificacion-emergente__boton notificacion-emergente__boton--cerrar';
    botonCerrar.innerText = '✕';
    botonCerrar.addEventListener('click', eliminar);
    divAcciones.appendChild(botonCerrar);

    elemento.appendChild(divAcciones);

    function eliminar() {
      elemento.classList.remove('notificacion-emergente--visible');
      setTimeout(function () {
        elemento.remove();
      }, 300);
    }

    return { elemento: elemento, eliminar: eliminar };
  }

  function mostrarNotificacion(mensaje, opciones) {
    opciones = opciones || {};
    var tipo = opciones.type || opciones.tipo || 'info';
    var duracion = opciones.duration || opciones.duracion || 4000;
    var textoAccion = opciones.actionText || opciones.textoAccion;
    var accion = opciones.action || opciones.accion;
    var persistente = opciones.persistent || opciones.persistente || false;

    var contenedor = asegurarContenedor();
    var resultado = crearElementoNotificacion(mensaje, {
      tipo: tipo,
      textoAccion: textoAccion,
      accion: accion,
    });

    contenedor.appendChild(resultado.elemento);
    requestAnimationFrame(function () {
      resultado.elemento.classList.add('notificacion-emergente--visible');
    });

    if (!persistente && duracion > 0) {
      setTimeout(resultado.eliminar, duracion);
    }

    return { eliminar: resultado.eliminar };
  }

  function mostrarConfirmacion(mensaje, opciones) {
    opciones = opciones || {};
    var textoConfirmar =
      opciones.confirmText || opciones.textoConfirmar || 'Confirmar';
    var textoCancelar =
      opciones.cancelText || opciones.textoCancelar || 'Cancelar';
    var tipo = opciones.type || opciones.tipo || 'warning';

    return new Promise(function (resolver) {
      var contenedor = asegurarContenedor();
      var elemento = document.createElement('div');
      elemento.className =
        'notificacion-emergente notificacion-emergente--' +
        tipo +
        ' notificacion-emergente--confirmar';

      var divMensaje = document.createElement('div');
      divMensaje.className = 'notificacion-emergente__mensaje';
      divMensaje.innerText = mensaje;
      elemento.appendChild(divMensaje);

      var divAcciones = document.createElement('div');
      divAcciones.className = 'notificacion-emergente__acciones';

      var botonCancelar = document.createElement('button');
      botonCancelar.className =
        'notificacion-emergente__boton notificacion-emergente__boton--cancelar';
      botonCancelar.innerText = textoCancelar;
      botonCancelar.addEventListener('click', function () {
        cerrar();
        resolver(false);
      });

      var botonAceptar = document.createElement('button');
      botonAceptar.className =
        'notificacion-emergente__boton notificacion-emergente__boton--aceptar';
      botonAceptar.innerText = textoConfirmar;
      botonAceptar.addEventListener('click', function () {
        cerrar();
        resolver(true);
      });

      divAcciones.appendChild(botonCancelar);
      divAcciones.appendChild(botonAceptar);
      elemento.appendChild(divAcciones);

      function cerrar() {
        elemento.classList.remove('notificacion-emergente--visible');
        setTimeout(function () {
          elemento.remove();
        }, 200);
      }

      contenedor.appendChild(elemento);
      requestAnimationFrame(function () {
        elemento.classList.add('notificacion-emergente--visible');
      });
    });
  }

  window.showToast = mostrarNotificacion;
  window.showConfirm = mostrarConfirmacion;
})();
