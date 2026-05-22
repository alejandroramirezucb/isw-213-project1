import cargarNavbar from './navbar-comun.js';
import obtenerClienteSupabase from './utilidades/ClienteSupabase.js';
import SoporteServicio from './servicios/SoporteServicio.js';
import VistaAyuda from './vistas/VistaAyuda.js';
import ControladorAyuda from './controladores/ControladorAyuda.js';
import './utilidades/Toaster.js';

document.addEventListener('DOMContentLoaded', async () => {
  await cargarNavbar();
  const clienteSupabase = await obtenerClienteSupabase();

  const vistaAyuda = new VistaAyuda();
  new ControladorAyuda(new SoporteServicio(), vistaAyuda, clienteSupabase);
});
