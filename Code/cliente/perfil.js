import cargarNavbar from './navbar-comun.js';
import obtenerClienteSupabase from './utilidades/ClienteSupabase.js';
import ModeloUsuario from './modelos/ModeloUsuario.js';
import VistaPerfil from './vistas/VistaPerfil.js';
import ControladorPerfil from './controladores/ControladorPerfil.js';
import './utilidades/Toaster.js';

document.addEventListener('DOMContentLoaded', async () => {
  await cargarNavbar();
  const clienteSupabase = await obtenerClienteSupabase();
  if (!clienteSupabase) { window.location.href = '/login'; return; }

  new VistaPerfil();
  new ControladorPerfil(new ModeloUsuario(clienteSupabase), clienteSupabase);
});
