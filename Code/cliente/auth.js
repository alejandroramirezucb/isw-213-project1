import cargarNavbar from './navbar-comun.js';
import obtenerClienteSupabase from './utilidades/ClienteSupabase.js';
import AuthServicio from './servicios/AuthServicio.js';
import ModeloAuth from './modelos/ModeloAuth.js';
import VistaAuth from './vistas/VistaAuth.js';
import ControladorAuth from './controladores/ControladorAuth.js';
import './utilidades/Toaster.js';

document.addEventListener('DOMContentLoaded', async () => {
  await cargarNavbar();
  const clienteSupabase = await obtenerClienteSupabase();
  if (!clienteSupabase) return;

  const authServicio = new AuthServicio(clienteSupabase);
  const modeloAuth = new ModeloAuth(authServicio);
  new VistaAuth();
  new ControladorAuth(modeloAuth);
});
