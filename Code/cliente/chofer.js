import cargarNavbar from './navbar-comun.js';
import obtenerClienteSupabase from './utilidades/ClienteSupabase.js';
import AuthServicio from './servicios/AuthServicio.js';
import ChoferServicio from './servicios/ChoferServicio.js';
import PedidoServicio from './servicios/PedidoServicio.js';
import ModeloChofer from './modelos/ModeloChofer.js';
import VistaPestanas from './vistas/VistaPestanas.js';
import VistaEntregasChofer from './vistas/VistaEntregasChofer.js';
import VistaEvidencia from './vistas/VistaEvidencia.js';
import ControladorChofer from './controladores/ControladorChofer.js';
import './utilidades/Toaster.js';

document.addEventListener('DOMContentLoaded', async () => {
  await cargarNavbar();
  const clienteSupabase = await obtenerClienteSupabase();
  if (!clienteSupabase) { window.location.href = '/login'; return; }

  const choferServicio = new ChoferServicio(clienteSupabase);

  new VistaPestanas({
    selectorPestana: '.panel-chofer__pestana',
    claseActivaPestana: 'panel-chofer__pestana--activa',
    selectorSeccion: '.panel-chofer__seccion',
    claseActivaSeccion: 'panel-chofer__seccion--activa',
  });
  new VistaEntregasChofer();
  new VistaEvidencia();

  new ControladorChofer(
    new ModeloChofer(choferServicio),
    choferServicio,
    new PedidoServicio(),
    new AuthServicio(clienteSupabase),
    clienteSupabase,
  );
});
