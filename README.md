# Tienda Raidencenter

<p align="center">
  <img src="Code/assets/banner-logo.png" alt="Tienda Raidencenter" width="360" />
</p>

---

## Índice

- [I. Análisis del problema](#analisis-del-problema)
  - [1. Descripción del problema](#descripcion-del-problema)
  - [2. Usuario / Cliente](#usuario-cliente)
  - [3. Dolor o necesidad](#dolor-o-necesidad)
  - [4. Alcance del sistema](#alcance-del-sistema)
- [II. Requerimientos funcionales](#requerimientos-funcionales)

---

## I. Análisis del problema

### 1. Descripción del problema

**¿Qué ocurre hoy en la realidad?**  
Actualmente, se tiene una incapacidad para comercializar productos y realizar entregas a través de internet. No existe un flujo para gestionar el inventario, las devoluciones o los pagos en cuotas de forma automatizada. Además, la logística de entrega no tiene supervisión, provocando que no se pueda conocer las rutas seguidas por los transportistas o que no se tenga pruebas de la recepción de los productos.

### 2. Usuario / Cliente

**¿Quién sufre el problema directamente?**

- **Usuario principal:** El cliente (habitante de Santa Cruz de la Sierra) que desea adquirir productos de forma virtual bajo una experiencia de "multicenter".
- **Otros afectados:** Administradores de inventario y choferes.
- **Contexto en el que ocurre el problema:** El problema se encuentra en Santa Cruz de la Sierra, con una demanda de 20,000 usuarios activos que requieren disponibilidad de servicio las 24 horas y flexibilidad en las formas de pago y entrega.

  ### 3. Dolor o necesidad

**¿Qué consecuencia negativa genera el problema?**

- **Limitación de mercado:** Al no haber ventas por internet, no se puede llegar a una población masiva de clientes potenciales.
- **Falta de control logístico:** El desorden en las rutas y que no haya evidencias fotográficas provocan desconfianza en los clientes y posibles pérdidas de productos.
- **Incertidumbre en el cliente:** La falta de estados claros (recibido, enviado, etc.) genera ansiedad, estrés, miedo y consultas constantes al soporte.
- **Dificultad administrativa:** Realizar de manera manual las devoluciones y reportes consume mucho tiempo y aumenta el riesgo de errores en la facturación y el inventario.

### 4. Alcance del sistema

**Qué SÍ va a resolver:**

- **Venta virtual:** Plataforma para 20,000 usuarios activos con soporte 24/7.
- **Gestión de pagos:** Integración de pagos en efectivo, tarjeta, QR y sistema de cuotas.
- **Módulo de logística/transporte:** Aplicación para choferes con registro de logs de ruta y captura de evidencia fotográfica.
- **Gestión de pedidos:** Flujo de estados (6 estados desde recibido hasta entregado) y confirmación de que fue entregado por parte del usuario.
- **Control administrativo:** Manejo de inventarios, reportes y sistema de devoluciones.
- **Métodos de entrega** : Opción de entrega vía delivery o recojo en almacén.

**Qué NO va a resolver:**

- **Ventas nacionales/internacionales:** El sistema está restringido exclusivamente a la ciudad de Santa Cruz de la Sierra.
- **Fabricación de productos:** El sistema está centrado en la comercialización y entrega, no en la fabricación de los productos.

## II. Requerimientos funcionales

**HU-01 Gestión de evidencia de entrega**

- **Orden de prioridad:** 8/21
- **Tipo de prioridad:** Alta
- **Historia:** Como chofer, quiero registrar una imagen y los logs de mi ubicación al momento de la entrega para tener un respaldo legal de que el producto llegó al destino correcto.
- **Criterios de aceptación:**
  - Dado que el chofer está en la ubicación del cliente, cuando marque el pedido como "Entregado", entonces el sistema debe obligarlo a subir una fotografía del paquete recibido.
  - Dado que el pedido está en el estado "Trasladandose", cuando el chofer está manejando, entonces el sistema debe guardar automáticamente las coordenadas GPS del chofer para su revisión en el panel administrativo.
- **Estimación:** 6 h

---

**HU-02 Pago flexible por cuotas**

- **Orden de prioridad:** 15/21
- **Tipo de prioridad:** Media
- **Historia:** Como cliente, quiero seleccionar la opción de pago en cuotas al finalizar mi compra para adquirir productos de mayor valor sin tener el dinero suficiente en ese momento.
- **Criterios de aceptación:**
  - Dado que el cliente está en la pasarela de pagos, cuando seleccione "Pago en cuotas", entonces el sistema debe mostrar el monto de cada cuota y el interes (si existe) antes de confirmar.
  - Dado que el cliente confirma el pago en cuotas, cuando se procese la transacción, entonces el estado del pedido debe pasar a "Recibido" y generar un plan de pagos visible para el cliente.
- **Estimación:** 3 h

---

**HU-03 Solicitud de devolución**

- **Orden de prioridad:** 16/21
- **Tipo de prioridad:** Media
- **Historia:** Como cliente, quiero solicitar la devolución de un producto dentro de las 24 horas para obtener un reembolso cumpliendo con las políticas de Raiden Corp. (factura y producto intacto).
- **Criterios de aceptación:**
  - Dado que han pasado menos de 24 horas desde la entrega, cuando el cliente entre a su pedido, entonces el botón "Solicitar Devolución" debe estar activo y exigir que se adjunte una foto de la factura.
  - Dado que han pasado más de 24 horas, cuando el cliente entre a su pedido, entonces el sistema debe deshabilitar automáticamente la opción de devolución, indicando que el plazo ha vencido.
- **Estimación:** 4 h

---

**HU-04 Seguimiento de estados del pedido**

- **Orden de prioridad:** 6/21
- **Tipo de prioridad:** Alta
- **Historia:** Como cliente, quiero visualizar en tiempo real los 6 estados de mi pedido (orden realizad, en proceso, enviado, trasladándose, listo para entregarse, entregado) para reducir la ansiedad y estrés sobre el tiempo de llegada de mi compra.
- **Criterios de aceptación:**
  - Dado que el administrador/chofer actualiza el progreso del pedido, cuando el cliente entre a la sección "Mis Pedidos", entonces debe ver una línea de tiempo con la fecha y hora de cada cambio de estado.
  - Dado que el pedido llega al estado "Listo para entregarse", cuando el sistema detecte el cambio, entonces debe enviar una notificación automática al usuario para que esté atento para saber cuándo lo recibirá o pase a recogerlo al almacén.
- **Estimación:** 3 h

---

**HU-05 Gestión de Stock**

- **Orden de prioridad:** 3/21
- **Tipo de prioridad:** Alta
- **Historia:** Como administrador, quiero que el sistema disminuya automáticamente los productos del inventario tras una venta, para evitar la venta de productos sin stock físico.
- **Criterios de aceptación:**
  - Dado que un cliente completa un pago (Efectivo, Tarjeta o QR), cuando el sistema procese la transacción, entonces debe restar automáticamente la cantidad comprada del stock disponible.
  - Dado que el stock de un producto llega a cero, cuando un cliente intente agregarlo al carrito, entonces el sistema debe mostrar un mensaje de "Producto Agotado" y deshabilitar el boton de compra.
- **Estimación:** 2 h

---

**HU-06 Opción de Recojo en Almacén**

- **Orden de prioridad:** 13/21
- **Tipo de prioridad:** Media
- **Historia:** Como cliente, quiero seleccionar la opción de "Recoger en Almacén" para ahorrarme los costos de envío.
- **Criterios de aceptación:**
  - Dado que el cliente está ingresando los datos de su pedido, cuando seleccione "Recojo en Almacén", entonces el sistema debe eliminar el cargo por delivery y mostrar la dirección exacta del almacén en Santa Cruz.
  - Dado que el pedido está listo para entregarse, cuando el cliente llegue al almacén, entonces el encargado debe poder escanear el QR de confirmación en la app del cliente para marcar el pedido como "Entregado".
- **Estimación:** 4 h

---

**HU-07 Generación de Reportes**

- **Orden de prioridad:** 14/21
- **Tipo de prioridad:** Media
- **Historia:** Como administrador, quiero generar reportes en formato PDF/Excel/Doc de las ventas y devoluciones del mes para realizar auditorías y análisis de rendimiento del negocio.
- **Criterios de aceptacion:**
  - Dado que el administrador está en el panel de control, cuando seleccione un rango de fechas y haga clic en "Generar Reporte", entonces el sistema debe descargar un archivo en el formato que elija con el resumen de ingresos, cantidad de pedidos y detalle de devoluciones.
  - Dado el reporte generado, cuando se visualice el documento, entonces debe incluir gráficos comparativos de los métodos de pago más utilizados (QR vs Tarjeta vs Efectivo).
- **Estimación:** 1 h

---

**HU-08 Pago mediante código QR**

- **Orden de prioridad:** 11/21
- **Tipo de prioridad:** Media
- **Historia:** Como cliente, quiero generar un código QR de pago al finalizar mi pedido para realizar una transferencia rápida y segura desde mi aplicación bancaria.
- **Criterios de aceptación:**
  - Dado que el cliente elige "Pago por QR", cuando confirme el pedido, entonces el sistema debe generar el QR del monto total de la compra.
  - Dado que el banco confirma que llegó el dinero, cuando la pasarela de pagos notifique que todo salió bien, entonces el sistema debe cambiar automáticamente el estado del pedido a "Recibido".
- **Estimación:** 2 h

---

**HU-09 Monitoreo de Rutas**

- **Orden de prioridad:** 20/21
- **Tipo de prioridad:** Baja
- **Historia:** Como administrador, quiero visualizar el historial de rutas y paradas de los choferes para optimizar los tiempos de entrega y supervisar que se cumpla con la jornada laboral.
- **Criterios de aceptación:**
  - Dado que un chofer ha finalizado su jornada, cuando el administrador consulte el perfil del chofer, entonces el sistema debe mostrar un mapa con la ruta que realizó basado en los registros de GPS.
  - Dado el historial de entregas, cuando se revise un pedido, entonces el sistema debe mostrar la hora exacta en que el chofer llegó al domicilio del cliente.
- **Estimación:** 6 h

---

**HU-10 Confirmación de la finalización Pedido**

- **Orden de prioridad:** 12/21
- **Tipo de prioridad:** Media
- **Historia:** Como cliente, quiero confirmar dentro de la web que he recibido mi paquete para cerrar el ciclo del pedido.
- **Criterios de aceptación:**
  - Dado que el chofer ha marcado el pedido como "Entregado", cuando el cliente abra la aplicación, entonces debe habilitarse el botón de "Confirmar Recepción".
  - Dado que el cliente confirma la recepción, cuando presione el botón, entonces el estado del pedido debe cambiar a "Cerrado/Finalizado" y habilitar la opción de calificar el servicio.
- **Estimación:** 2 h

---

**HU-11 Gestión de Catálogo de Productos**

- **Orden de prioridad:** 2/21
- **Tipo de prioridad:** Alta
- **Historia:** Como administrador, quiero categorizar y gestionar los productos (ver, crear, editar, eliminar) para que el catalogo sea igual a lo que está en el almacén.
- **Criterios de aceptación:**
  - Dado que el administrador está en el panel de gestión, cuando cree un nuevo producto, entonces el sistema debe permitirle asignar categorías, fotos, descripción y precio.
  - Dado que un producto cambia de precio, cuando el administrador lo actualice en el sistema, entonces el cambio debe mostrarse automáticamente para los 20,000 usuarios.
- **Estimación:** 4 h

---

**HU-12 Alerta de Stock Mínimo**

- **Orden de prioridad:** 19/21
- **Tipo de prioridad:** Baja
- **Historia:** Como administrador, quiero recibir notificaciones automáticas cuando un producto tenga pocas unidades en el stock para realizar la reposición a tiempo y no perder ventas.
- **Criterios de aceptación:**
  - Dado que el inventario disminuye por cada venta, cuando el stock llegue a una cantidad, entonces el sistema debe enviar un correo o alerta al panel de administración.
  - Dado que el administrador revisa las alertas, cuando acceda a la sección de "Stock Bajo", entonces debe visualizar una lista de productos que requieren reabastecimiento urgente.
- **Estimación:** 1 h

---

**HU-13 Pago con Tarjeta de Crédito/Débito**

- **Orden de prioridad:** 5/21
- **Tipo de prioridad:** Alta
- **Historia:** Como cliente, quiero pagar con mi tarjeta de crédito o débito para completar mi compra sin necesidad de efectivo.
- **Criterios de aceptación:**
  - Dado que el cliente elige "Pago con Tarjeta", cuando ingrese los datos, entonces el sistema debe realizar la transacción a través de una pasarela de pagos y mostrar el éxito o rechazo al instante.
  - Dado que la transacción es aprobada, cuando el pago se procese, entonces el sistema debe generar automáticamente la factura y cambiar el estado del pedido a "Recibido".
- **Estimación:** 1 h

---

**HU-14 Hoja de Ruta del Chofer**

- **Orden de prioridad:** 7/21
- **Tipo de prioridad:** Alta
- **Historia:** Como chofer, quiero visualizar una lista ordenada de mis entregas pendientes en la ciudad de Santa Cruz para organizar mi recorrido de la manera más eficiente.
- **Criterios de aceptación:**
  - Dado que el chofer inicia su turno en el almacén, cuando acceda a "Mis Entregas", entonces debe ver una lista de pedidos en estado "Enviado" con la dirección, nombre del cliente y ubicación estimada del cliente (por GPS).
  - Dado que el chofer selecciona un pedido de la lista, cuando presione "Iniciar Entrega", entonces el estado del pedido debe cambiar automáticamente a "Trasladándose" y notificar al cliente.
- **Estimación:** 4 h

---

**HU-15 Aprobación de Devoluciones**

- **Orden de prioridad:** 17/21
- **Tipo de prioridad:** Media
- **Historia:** Como administrador, quiero revisar las solicitudes de devolución enviadas por los clientes para verificar el cumplimiento de las políticas de Raiden Corp (factura y producto intacto) antes de aceptar el reembolso.
- **Criterios de aceptación:**
  - Dado que un cliente envio una solicitud de devolución (HU-03), cuando el administrador la revise, entonces debe poder ver la foto de la factura y el motivo de la devolución.
  - Dado que el producto es recibido y está intacto, cuando el administrador haga clic en "Aprobar Devolución", entonces el sistema debe actualizar el stock para sumar el producto devuelto y notificar al cliente sobre su reembolso.
- **Estimación:** 4 h

---

**HU-16 Pago en Efectivo**

- **Orden de prioridad:** 18/21
- **Tipo de prioridad:** Baja
- **Historia:** Como cliente, quiero elegir el pago en efectivo al recibir mi pedido para realizar la compra sin usar medios digitales.
- **Criterios de aceptación:**
  - Dado que el cliente selecciona "Pago en Efectivo", cuando el chofer llegue al domicilio, entonces el sistema debe mostrarle al chofer el monto a cobrar antes de entregar el paquete.
  - Dado que el cobro fue realizado, cuando el chofer marque "Cobro Exitoso", entonces el sistema debe habilitar el botón para sacar una foto de evidencia para cerrar el pedido.
- **Estimación:** 1 h

---

**HU-17 Carrito de Compras**

- **Orden de prioridad:** 4/21
- **Tipo de prioridad:** Alta
- **Historia:** Como cliente, quiero agregar varios productos a un carrito de compras para realizar un solo pago por todo mi pedido.
- **Criterios de aceptación:**
  - Dado que el cliente navega por la tienda, cuando haga clic en "Agregar al carrito", entonces el sistema debe mostrar un resumen con el total a pagar y la cantidad de productos.
  - Dado que el cliente está en el carrito, cuando modifique la cantidad de un producto, entonces el sistema debe recalcular el total a pagar y verificar el stock disponible.
- **Estimación:** 4 h

---

**HU-18 Buscador con Filtros**

- **Orden de prioridad:** 9/21
- **Tipo de prioridad:** Alta
- **Historia:** Como cliente, quiero filtrar los productos por precio, categoria y disponibilidad para encontrar rápidamente lo que quiero comprar.
- **Criterios de aceptación:**
  - Dado que el usuario escribe en el buscador, cuando presione "Enter", entonces el sistema debe mostrar resultados en menos de 2 segundos.
  - Dado que hay muchos resultados, cuando el usuario aplique un filtro de "Rango de Precio", entonces la lista debe actualizarse.
- **Estimación:** 2 h

---

**HU-19 Historial de Pedidos y Facturas**

- **Orden de prioridad:** 10/21
- **Tipo de prioridad:** Alta
- **Historia:** Como cliente, quiero acceder a un historial de mis compras para descargar mis facturas y revisar el estado de mis pagos en cuotas.
- **Criterios de aceptación:**
  - Dado que el cliente esta en su perfil, cuando entre a "Mis Compras", entonces debe ver una lista de todos sus pedidos con sus respectivos estados.
  - Dado un pedido pagado, cuando el cliente haga clic en "Ver Factura", entonces el sistema debe generar un archivo descargable con los datos de la compra.
- **Estimación:** 3 h

---

**HU-20 Centro de Ayuda y Consultas**

- **Orden de prioridad:** 21/21
- **Tipo de prioridad:** Baja
- **Historia:** Como cliente, quiero acceder a una sección de preguntas frecuentes para resolver dudas sobre el delivery, métodos de pago y políticas de devolución.
- **Criterios de aceptación:**
  - Dado que el usuario tiene una duda, cuando acceda al Centro de Ayuda, entonces debe encontrar categorías claras (Pagos, Envíos, Devoluciones).
  - Dado que la respuesta no es suficiente, cuando el usuario haga clic en "Contactar Soporte", entonces el sistema debe redirigirlo a un formulario de contacto.
- **Estimación:** 4 h

---

**HU-21 Visualización de Productos**

- **Orden de prioridad:** 1/21
- **Tipo de prioridad:** Alta
- **Historia:** Como cliente, quiero navegar por el catálogo y ver los productos disponibles con sus fotos, precios y el pago por cuotas para elegir qué comprar.
- **Criterios de aceptación:**
  - Dado que el cliente está en la página principal, cuando carguen los productos, entonces debe poder ver una lista de productos con sus nombres, precios, y el precio si pagara por cuotas.
  - Dado que el cliente selecciona un producto, cuando presione el producto, el sistema debe mostrar sus detalles (nombre, descripción, precio) y el botón de "Agregar al carrito" HU-17.
- **Estimación:** 4 h
