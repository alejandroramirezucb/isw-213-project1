export function capturarEvento(nombre) {
  const capturado = {};
  document.addEventListener(nombre, (evento) => { capturado.detail = evento.detail; }, { once: true });
  return capturado;
}
