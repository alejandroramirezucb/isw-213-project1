import cargarNavbar from './navbar-comun.js';
import obtenerClienteSupabase from './utilidades/ClienteSupabase.js';
import PedidoServicio from './servicios/PedidoServicio.js';
import DevolucionServicio from './servicios/DevolucionServicio.js';
import ModeloPedido from './modelos/ModeloPedido.js';
import VistaHistorial from './vistas/VistaHistorial.js';
import VistaDevolucionCliente from './vistas/VistaDevolucionCliente.js';
import ControladorHistorial from './controladores/ControladorHistorial.js';
import './utilidades/Toaster.js';

document.addEventListener('DOMContentLoaded', async () => {
  await cargarNavbar();
  const clienteSupabase = await obtenerClienteSupabase();
  if (!clienteSupabase) { window.location.href = '/login'; return; }

  const modeloPedido = new ModeloPedido(new PedidoServicio(), null);

  new VistaHistorial();
  new VistaDevolucionCliente();
  new ControladorHistorial(modeloPedido, new DevolucionServicio(clienteSupabase), clienteSupabase);
});
