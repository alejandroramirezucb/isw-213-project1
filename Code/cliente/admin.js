import cargarNavbar from './navbar-comun.js';
import obtenerClienteSupabase from './utilidades/ClienteSupabase.js';
import AuthServicio from './servicios/AuthServicio.js';
import PedidoServicio from './servicios/PedidoServicio.js';
import DevolucionServicio from './servicios/DevolucionServicio.js';
import SoporteServicio from './servicios/SoporteServicio.js';
import ModeloProductoAdmin from './modelos/ModeloProductoAdmin.js';
import ModeloDevolucion from './modelos/ModeloDevolucion.js';
import ModeloSoporte from './modelos/ModeloSoporte.js';
import ModeloPedido from './modelos/ModeloPedido.js';
import ModeloReporte from './modelos/ModeloReporte.js';
import VistaPestanas from './vistas/VistaPestanas.js';
import VistaCatalogo from './vistas/VistaCatalogo.js';
import VistaStock from './vistas/VistaStock.js';
import VistaReporte from './vistas/VistaReporte.js';
import VistaMonitoreoRutas from './vistas/VistaMonitoreoRutas.js';
import VistaDevolucionAdmin from './vistas/VistaDevolucionAdmin.js';
import VistaPedidosAdmin from './vistas/VistaPedidosAdmin.js';
import VistaSoporte from './vistas/VistaSoporte.js';
import ControladorCatalogAdmin from './controladores/ControladorCatalogAdmin.js';
import ControladorStockAdmin from './controladores/ControladorStockAdmin.js';
import ControladorReporteAdmin from './controladores/ControladorReporteAdmin.js';
import ControladorRutasAdmin from './controladores/ControladorRutasAdmin.js';
import ControladorDevolucionAdmin from './controladores/ControladorDevolucionAdmin.js';
import ControladorPedidosAdmin from './controladores/ControladorPedidosAdmin.js';
import ControladorSoporteAdmin from './controladores/ControladorSoporteAdmin.js';
import './utilidades/Toaster.js';

document.addEventListener('DOMContentLoaded', async () => {
  await cargarNavbar();
  const clienteSupabase = await obtenerClienteSupabase();
  if (!clienteSupabase) { window.location.href = '/login'; return; }

  const { data } = await clienteSupabase.auth.getSession();
  if (!data.session) { window.location.href = '/login'; return; }

  const authServicio = new AuthServicio(clienteSupabase);
  const esAdmin = await authServicio.verificarRol(data.session.user.id, 'administrador');
  if (!esAdmin) { window.location.href = '/'; return; }

  const modeloProductoAdmin = new ModeloProductoAdmin(clienteSupabase);
  const devolucionServicio = new DevolucionServicio(clienteSupabase);
  const modeloDevolucion = new ModeloDevolucion(devolucionServicio);
  const soporteServicio = new SoporteServicio();
  const modeloSoporte = new ModeloSoporte(soporteServicio);
  const pedidoServicio = new PedidoServicio();
  const modeloPedido = new ModeloPedido(pedidoServicio, null);
  const modeloReporte = new ModeloReporte(clienteSupabase);

  new VistaPestanas({
    selectorPestana: '.panel-admin__pestana',
    claseActivaPestana: 'panel-admin__pestana--activa',
    selectorSeccion: '.panel-admin__seccion',
    claseActivaSeccion: 'panel-admin__seccion--activa',
  });

  const vistaCatalogo = new VistaCatalogo();
  const vistaStock = new VistaStock();
  const vistaReporte = new VistaReporte();
  const vistaMonitoreoRutas = new VistaMonitoreoRutas(clienteSupabase);
  new VistaDevolucionAdmin();
  const vistaPedidosAdmin = new VistaPedidosAdmin();
  new VistaSoporte();

  new ControladorCatalogAdmin(modeloProductoAdmin, vistaCatalogo);
  new ControladorStockAdmin(modeloProductoAdmin, vistaStock, clienteSupabase);
  new ControladorReporteAdmin(modeloReporte, vistaReporte);
  new ControladorRutasAdmin(vistaMonitoreoRutas, clienteSupabase);
  new ControladorDevolucionAdmin(modeloDevolucion);
  new ControladorPedidosAdmin(modeloPedido, vistaPedidosAdmin);
  new ControladorSoporteAdmin(modeloSoporte);
});
