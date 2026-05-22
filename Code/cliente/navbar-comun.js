import obtenerClienteSupabase from './utilidades/ClienteSupabase.js';
import CarritoServicio from './servicios/CarritoServicio.js';
import ActualizadorContador from './utilidades/ActualizadorContador.js';
import VistaNavbar from './vistas/VistaNavbar.js';

async function cargarNavbar() {
  const clienteSupabase = await obtenerClienteSupabase();
  new VistaNavbar(clienteSupabase);

  const carritoServicio = new CarritoServicio();
  new ActualizadorContador(carritoServicio).actualizar();
}

export default cargarNavbar;
