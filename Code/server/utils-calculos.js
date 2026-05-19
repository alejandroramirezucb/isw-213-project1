function calcularPrecioCuota(precioTotal, numeroCuotas) {
  if (!numeroCuotas || numeroCuotas <= 0) return 0;
  return precioTotal / numeroCuotas;
}

function calcularStockFinal(stockInicial, cantidadVendida) {
  const nuevoStock = stockInicial - cantidadVendida;
  return nuevoStock < 0 ? 0 : nuevoStock;
}

function validarStock(stock, cantidadSolicitada) {
  return stock >= cantidadSolicitada;
}

function calcularDiferenciaHoras(fechaInicio, fechaFin) {
  const diferencia = fechaFin - fechaInicio;
  return diferencia / (1000 * 60 * 60);
}

function estaEntrePlazo24h(fechaEntrega) {
  const ahora = new Date();
  const diferencia = ahora - fechaEntrega;
  const plazo24h = 24 * 60 * 60 * 1000;
  return diferencia <= plazo24h;
}

function permitirDevolución(estado, plazoVencido) {
  const estadosPermitidos = ['entregado', 'cerrado'];
  return estadosPermitidos.includes(estado) && !plazoVencido;
}

function validarFoto(fotoUrl) {
  return fotoUrl !== null && fotoUrl !== undefined && fotoUrl.length > 0;
}

function validarEstadoTransicion(estadoActual, estadoNuevo) {
  const estadosValidos = ['recibido', 'en_proceso', 'enviado', 'trasladandose', 'listo', 'entregado'];
  const indexActual = estadosValidos.indexOf(estadoActual);
  const indexNuevo = estadosValidos.indexOf(estadoNuevo);
  return indexNuevo > indexActual;
}

function calcularCostoEnvío(metodoEntrega) {
  return metodoEntrega === 'delivery' ? 15 : 0;
}

function obtenerEstadoDisponibilidad(stock) {
  if (stock > 10) return 'disponible';
  if (stock > 0) return 'bajo_stock';
  return 'agotado';
}

function validarPedido(usuarioId, detalles) {
  return (usuarioId !== null && usuarioId !== undefined) && Array.isArray(detalles) && detalles.length > 0;
}

module.exports = {
  calcularPrecioCuota,
  calcularStockFinal,
  validarStock,
  calcularDiferenciaHoras,
  estaEntrePlazo24h,
  permitirDevolución,
  validarFoto,
  validarEstadoTransicion,
  calcularCostoEnvío,
  obtenerEstadoDisponibilidad,
  validarPedido
};
