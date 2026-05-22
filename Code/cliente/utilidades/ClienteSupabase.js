import { createClient } from '@supabase/supabase-js';

let clienteSupabaseGlobal = null;
let promesaInicializacion = null;

async function obtenerClienteSupabase() {
  if (clienteSupabaseGlobal) return clienteSupabaseGlobal;
  if (promesaInicializacion) return promesaInicializacion;

  promesaInicializacion = fetch('/config')
    .then((r) => r.json())
    .then(({ supabaseUrl, supabaseKey }) => {
      if (!supabaseUrl || !supabaseKey) return null;
      clienteSupabaseGlobal = createClient(supabaseUrl, supabaseKey);
      return clienteSupabaseGlobal;
    })
    .catch(() => null);

  return promesaInicializacion;
}

export default obtenerClienteSupabase;
