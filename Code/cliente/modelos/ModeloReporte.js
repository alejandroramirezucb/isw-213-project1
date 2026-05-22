class ModeloReporte {
  constructor(clienteSupabase) {
    this._supabase = clienteSupabase;
  }

  async generar(fechaInicio, fechaFin) {
    const fechaFinAjustada = `${fechaFin}T23:59:59`;

    const [resPedidos, resPagos] = await Promise.all([
      this._supabase
        .from('pedidos')
        .select('id, monto_total, estado, fecha_creacion')
        .gte('fecha_creacion', fechaInicio)
        .lte('fecha_creacion', fechaFinAjustada),
      this._supabase
        .from('pagos')
        .select('metodo_pago, monto_total_pagado, pedido_id')
        .gte('created_at', fechaInicio)
        .lte('created_at', fechaFinAjustada),
    ]);

    const pedidos = resPedidos.data || [];
    const pagos = resPagos.data || [];

    let ingresos = 0;
    let devoluciones = 0;
    pedidos.forEach((pedido) => {
      if (pedido.estado === 'devuelto') devoluciones++;
      ingresos += pedido.monto_total || 0;
    });

    const metodos = { efectivo: 0, tarjeta: 0, qr: 0 };
    pagos.forEach((pago) => {
      const metodo = (pago.metodo_pago || '').toLowerCase();
      if (metodo === 'efectivo') metodos.efectivo++;
      else if (metodo === 'tarjeta') metodos.tarjeta++;
      else if (metodo === 'qr') metodos.qr++;
    });

    document.dispatchEvent(new CustomEvent('reporte:datosListos', {
      detail: { pedidos, pagos, ingresos, devoluciones, metodos },
    }));
  }
}

export default ModeloReporte;
