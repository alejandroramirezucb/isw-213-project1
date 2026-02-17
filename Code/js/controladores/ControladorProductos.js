class ControladorProductos {
  constructor(productoServicio, carritoServicio, actualizadorContador) {
    this.productoServicio = productoServicio;
    this.carritoServicio = carritoServicio;
    this.actualizadorContador = actualizadorContador;
    this.filtrosActivos = {};
  }

  async cargarProductos(filtros = {}) {
    try {
      this.filtrosActivos = { ...this.filtrosActivos, ...filtros };
      const productos = await this.productoServicio.obtenerTodos(
        this.filtrosActivos,
      );
      this.mostrarProductos(productos);

      if (
        this.filtrosActivos.busqueda ||
        this.filtrosActivos.categoria ||
        this.filtrosActivos.precioMinimo ||
        this.filtrosActivos.precioMaximo ||
        this.filtrosActivos.soloDisponibles
      )
        this.mostrarContadorResultados(productos.length);
      else this.ocultarContadorResultados();
    } catch (error) {
      console.error('Error al cargar productos:', error);
      this.mostrarError();
    }
  }

  async mostrarProductos(productos) {
    const contenedor = document.getElementById('contenedor-productos');
    if (!contenedor) return;

    if (!productos || productos.length === 0) {
      contenedor.innerHTML =
        '<p style="text-align: center; padding: 20px;">No se encontraron productos disponibles.</p>';
      return;
    }

    const respuestaTarjeta = await fetch('/api/producto-tarjeta');
    const plantillaBase = await respuestaTarjeta.text();
    contenedor.innerHTML = '';

    productos.forEach((producto) => {
      const tarjeta = this.crearTarjetaProducto(producto, plantillaBase);
      contenedor.appendChild(tarjeta);
    });
  }

  crearTarjetaProducto(producto, plantillaBase) {
    const imagenUrl =
      producto.images &&
      producto.images[0] &&
      producto.images[0].startsWith('http')
        ? producto.images[0]
        : 'https://resources.multicenter.com.bo/products/silla-gregor.jpg';

    const precio = producto.price || 0;
    const cuota = CalculadorPrecio.calcularCuotas(precio);

    let htmlTarjeta = plantillaBase
      .replace(/{{id}}/g, producto.id || '')
      .replace(/{{name}}/g, producto.name || 'Sin nombre')
      .replace(/{{brand}}/g, producto.brand || 'Genérico')
      .replace(/{{price}}/g, precio)
      .replace(/{{image}}/g, imagenUrl)
      .replace(/{{cuota}}/g, cuota)
      .replace(/{{stock}}/g, producto.stock || 0);

    const div = document.createElement('div');
    div.innerHTML = htmlTarjeta.trim();
    const tarjeta = div.firstElementChild;

    const botonAgregar = tarjeta.querySelector('.btn-agregar');
    if (botonAgregar) {
      botonAgregar.addEventListener('click', async (e) => {
        e.stopPropagation();
        console.debug('ControladorProductos: click agregar', {
          id: producto.id,
        });
        await this.agregarAlCarrito(
          {
            id: producto.id,
            nombre: producto.name,
            name: producto.name,
            precio: producto.price,
            price: producto.price,
            imagen: imagenUrl,
            url_imagen: imagenUrl,
            images: [imagenUrl],
            stock: producto.stock,
          },
          botonAgregar,
        );
      });
    }

    tarjeta.style.cursor = 'pointer';
    tarjeta.addEventListener('click', () => {
      window.location.href = `/producto/${producto.id}`;
    });

    return tarjeta;
  }

  async agregarAlCarrito(producto, botonEle) {
    try {
      const stockInfo = await this.productoServicio.verificarStock(producto.id);

      if (!stockInfo.disponible || stockInfo.stock === 0) {
        showToast('Lo sentimos, este producto no está disponible en stock.', {
          type: 'warning',
        });
        return;
      }

      const carrito = this.carritoServicio.obtenerCarrito();
      const itemExistente = carrito.find((item) => item.id === producto.id);

      if (itemExistente) {
        const nuevaCantidad = itemExistente.cantidad + 1;

        if (nuevaCantidad > stockInfo.stock) {
          showToast(
            `Solo hay ${stockInfo.stock} unidades disponibles de este producto.`,
            { type: 'warning' },
          );
          return;
        }
      }

      this.carritoServicio.agregarProducto(producto, 1);

      if (botonEle) {
        const textoOriginal = botonEle.innerText;
        botonEle.innerText = '¡Agregado!';
        botonEle.disabled = true;
        setTimeout(() => {
          botonEle.innerText = textoOriginal;
          botonEle.disabled = false;
        }, 1500);
      }

      this.mostrarNotificacion();
      this.actualizadorContador.actualizar();
    } catch (error) {
      console.error('Error al verificar stock:', error);
      showToast(
        'Error al agregar el producto al carrito. Por favor, intente nuevamente.',
        { type: 'error' },
      );
    }
  }

  mostrarNotificacion() {
    const notificacion = document.getElementById('notificacion-carrito');
    if (!notificacion) return;

    const total = this.carritoServicio.obtenerPrecioTotal();
    const cantidad = this.carritoServicio.obtenerCantidadTotal();

    notificacion.innerHTML = `
            <h4>¡Producto Añadido!</h4>
            <p>Has agregado un producto a tu carrito.</p>
            <p>Cantidad total: <strong>${cantidad}</strong></p>
            <div class="total">Total estimado: Bs. ${total.toFixed(2)}</div>
            <a href="/carrito" class="btn-primary" style="display:block; margin-top:15px; text-align:center; padding:10px; font-size:14px;">Ver mi Carrito</a>
        `;

    notificacion.style.display = 'block';

    if (this.timeoutNotificacion) clearTimeout(this.timeoutNotificacion);
    this.timeoutNotificacion = setTimeout(() => {
      notificacion.style.display = 'none';
    }, 4000);
  }

  mostrarContadorResultados(cantidad) {
    let contador = document.getElementById('contador-resultados');

    if (!contador) {
      contador = document.createElement('div');
      contador.id = 'contador-resultados';
      contador.className = 'contador-resultados';

      const contenedor = document.getElementById('contenedor-productos');
      if (contenedor && contenedor.parentNode)
        contenedor.parentNode.insertBefore(contador, contenedor);
    }

    contador.textContent = `Se encontraron ${cantidad} producto(s)`;
    contador.style.display = 'block';
  }

  ocultarContadorResultados() {
    const contador = document.getElementById('contador-resultados');
    if (contador) contador.style.display = 'none';
  }

  mostrarError() {
    const contenedor = document.getElementById('contenedor-productos');
    if (contenedor)
      contenedor.innerHTML =
        '<p style="text-align: center; padding: 20px;">Error al cargar los productos. Por favor, intente nuevamente.</p>';
  }

  limpiarFiltros() {
    this.filtrosActivos = {};
    this.cargarProductos();
  }
}
