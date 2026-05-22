import cargarNavbar from './navbar-comun.js';
import obtenerClienteSupabase from './utilidades/ClienteSupabase.js';
import CarritoServicio from './servicios/CarritoServicio.js';
import ProductoServicio from './servicios/ProductoServicio.js';
import PedidoServicio from './servicios/PedidoServicio.js';
import ActualizadorContador from './utilidades/ActualizadorContador.js';
import ModeloCarrito from './modelos/ModeloCarrito.js';
import ModeloPedido from './modelos/ModeloPedido.js';
import VistaCarrito from './vistas/VistaCarrito.js';
import VistaPago from './vistas/VistaPago.js';
import ControladorCarrito from './controladores/ControladorCarrito.js';
import './utilidades/Toaster.js';

document.addEventListener('DOMContentLoaded', async () => {
  await cargarNavbar();
  const clienteSupabase = await obtenerClienteSupabase();

  const carritoServicio = new CarritoServicio();
  const productoServicio = new ProductoServicio();
  const actualizadorContador = new ActualizadorContador(carritoServicio);
  const modeloCarrito = new ModeloCarrito(carritoServicio, productoServicio);
  const modeloPedido = new ModeloPedido(new PedidoServicio(), carritoServicio);

  new VistaCarrito();
  const vistaPago = new VistaPago(carritoServicio);

  document.addEventListener('pago:abrirModal', (e) => {
    vistaPago.abrirModalPago(e.detail.total, e.detail.metodoPago);
  });

  new ControladorCarrito(modeloCarrito, modeloPedido, carritoServicio, clienteSupabase);
  actualizadorContador.actualizar();
});
