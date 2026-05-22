class VistaPestanas {
  constructor({ selectorPestana, claseActivaPestana, selectorSeccion, claseActivaSeccion, prefijoSeccion }) {
    this._selectorPestana = selectorPestana;
    this._claseActivaPestana = claseActivaPestana;
    this._selectorSeccion = selectorSeccion;
    this._claseActivaSeccion = claseActivaSeccion;
    this._prefijoSeccion = prefijoSeccion || 'seccion-';
    this._inicializar();
  }

  _inicializar() {
    const pestanas = document.querySelectorAll(this._selectorPestana);
    pestanas.forEach((pestana) => {
      pestana.addEventListener('click', () => {
        pestanas.forEach((p) => p.classList.remove(this._claseActivaPestana));
        pestana.classList.add(this._claseActivaPestana);

        document.querySelectorAll(this._selectorSeccion).forEach((s) => {
          s.classList.remove(this._claseActivaSeccion);
        });

        const seccionId = this._prefijoSeccion + pestana.getAttribute('data-seccion');
        const seccionActiva = document.getElementById(seccionId);
        if (seccionActiva) seccionActiva.classList.add(this._claseActivaSeccion);

        document.dispatchEvent(new CustomEvent('pestana:cambiada', { detail: { seccionId } }));
      });
    });
  }
}

export default VistaPestanas;
