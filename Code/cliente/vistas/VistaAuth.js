class VistaAuth {
  constructor() {
    this._bindFormularios();
  }

  _bindFormularios() {
    const formularioLogin = document.getElementById('formularioLogin');
    if (formularioLogin) {
      formularioLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        const correo = document.getElementById('correoLogin')?.value.trim();
        const contrasena = document.getElementById('contrasenaLogin')?.value;
        if (!correo || !contrasena) {
          if (window.showToast) window.showToast('Completa todos los campos', { tipo: 'warning' });
          return;
        }
        document.dispatchEvent(new CustomEvent('auth:loginEnviado', { detail: { correo, contrasena } }));
      });
    }

    const formularioRegistro = document.getElementById('formularioRegistro');
    if (formularioRegistro) {
      formularioRegistro.addEventListener('submit', (e) => {
        e.preventDefault();
        const nombre = document.getElementById('nombreRegistro')?.value.trim();
        const correo = document.getElementById('correoRegistro')?.value.trim();
        const contrasena = document.getElementById('contrasenaRegistro')?.value;
        const confirmar = document.getElementById('confirmarContrasena')?.value;
        const telefono = document.getElementById('telefonoRegistro')?.value.trim() || null;
        const rol = document.getElementById('rolRegistro')?.value || 'cliente';

        if (!nombre || !correo || !contrasena) {
          if (window.showToast) window.showToast('Completa todos los campos', { tipo: 'warning' });
          return;
        }
        if (confirmar && contrasena !== confirmar) {
          if (window.showToast) window.showToast('Las contraseñas no coinciden', { tipo: 'warning' });
          return;
        }
        document.dispatchEvent(new CustomEvent('auth:registroEnviado', {
          detail: { nombre, correo, contrasena, telefono, rol },
        }));
      });
    }
  }

  mostrarError(mensaje) {
    if (window.showToast) window.showToast(mensaje, { tipo: 'error' });
  }

  mostrarExito(mensaje) {
    if (window.showToast) window.showToast(mensaje, { tipo: 'success' });
  }
}

export default VistaAuth;
