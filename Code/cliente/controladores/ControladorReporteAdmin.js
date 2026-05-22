class ControladorReporteAdmin {
  constructor(modeloReporte, vistaReporte) {
    this._modelo = modeloReporte;
    this._vista = vistaReporte;
    this._bindEventos();
  }

  _bindEventos() {
    document.addEventListener('reporte:generarSolicitado', async (e) => {
      const { fechaInicio, fechaFin, formato } = e.detail;
      const datos = await this._capturarDatos(fechaInicio, fechaFin);
      if (datos) {
        this._vista.descargar(datos.pedidos, datos.pagos, datos.metodos, datos.ingresos, datos.devoluciones, fechaInicio, fechaFin, formato);
      }
    });

    document.addEventListener('reporte:datosListos', (e) => {
      const { pedidos, pagos, metodos, ingresos, devoluciones } = e.detail;
      this._datosUltimos = { pedidos, pagos, metodos, ingresos, devoluciones };
    });
  }

  async _capturarDatos(fechaInicio, fechaFin) {
    await this._modelo.generar(fechaInicio, fechaFin);
    return this._datosUltimos;
  }
}

export default ControladorReporteAdmin;
