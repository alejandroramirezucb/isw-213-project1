let clienteSupabaseGlobal = null;
let promesaInicializacionSupabase = null;

function obtenerClienteSupabase() {
  if (clienteSupabaseGlobal) {
    return Promise.resolve(clienteSupabaseGlobal);
  }

  if (promesaInicializacionSupabase) {
    return promesaInicializacionSupabase;
  }

  promesaInicializacionSupabase = fetch('/config')
    .then(function (respuesta) {
      return respuesta.json();
    })
    .then(function (configuracion) {
      if (
        !configuracion.supabaseUrl ||
        !configuracion.supabaseKey ||
        !window.supabase
      ) {
        return null;
      }
      clienteSupabaseGlobal = window.supabase.createClient(
        configuracion.supabaseUrl,
        configuracion.supabaseKey,
      );
      return clienteSupabaseGlobal;
    })
    .catch(function () {
      return null;
    });

  return promesaInicializacionSupabase;
}
