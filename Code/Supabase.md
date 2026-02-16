CREATE TYPE tipo_rol AS ENUM ('administrador', 'chofer', 'cliente');
CREATE TYPE tipo_estado_producto AS ENUM ('activo', 'inactivo');
CREATE TYPE tipo_estado_pedido AS ENUM ('recibido', 'en proceso', 'enviado', 'trasladandose', 'listo para entregarse', 'entregado', 'cerrado');
CREATE TYPE tipo_metodo_entrega AS ENUM ('delivery', 'recojo_almacen');
CREATE TYPE tipo_metodo_pago AS ENUM ('efectivo', 'tarjeta', 'qr');
CREATE TYPE tipo_estado_pago AS ENUM ('pendiente', 'pagado', 'fallido');
CREATE TYPE tipo_estado_cuota AS ENUM ('pendiente', 'pagado');
CREATE TYPE tipo_estado_devolucion AS ENUM ('pendiente', 'aprobada', 'rechazada');

CREATE TABLE usuarios (
id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
nombre_completo VARCHAR(100) NOT NULL,
correo_electronico VARCHAR(100) UNIQUE NOT NULL,
password VARCHAR(255) NOT NULL,
telefono VARCHAR(20),
rol tipo_rol NOT NULL,
fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categorias (
id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
nombre VARCHAR(50) NOT NULL,
descripcion TEXT
);

CREATE TABLE productos (
id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
categoria_id INT REFERENCES categorias(id),
nombre VARCHAR(150) NOT NULL,
descripcion TEXT,
precio_actual DECIMAL(10,2) NOT NULL,
stock_disponible INT NOT NULL DEFAULT 0,
stock_minimo_alerta INT DEFAULT 5,
url_imagen VARCHAR(255),
estado tipo_estado_producto DEFAULT 'activo'
);

CREATE TABLE pedidos (
id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
usuario_id INT REFERENCES usuarios(id),
monto_total DECIMAL(10,2) NOT NULL,
estado tipo_estado_pedido DEFAULT 'recibido',
metodo_entrega tipo_metodo_entrega NOT NULL,
direccion_destino TEXT,
fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
fecha_entrega_final TIMESTAMP NULL,
confirmacion_cliente BOOLEAN DEFAULT FALSE
);

CREATE TABLE detalles_pedido (
id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
pedido_id INT REFERENCES pedidos(id),
producto_id INT REFERENCES productos(id),
cantidad INT NOT NULL,
precio_unitario_venta DECIMAL(10,2) NOT NULL
);

CREATE TABLE pagos (
id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
pedido_id INT REFERENCES pedidos(id),
metodo_pago tipo_metodo_pago NOT NULL,
estado_pago tipo_estado_pago DEFAULT 'pendiente',
es_en_cuotas BOOLEAN DEFAULT FALSE,
cantidad_cuotas INT DEFAULT 1,
referencia_transaccion VARCHAR(100),
monto_total_pagado DECIMAL(10,2) NOT NULL
);

CREATE TABLE cronograma_cuotas (
id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
pago_id INT REFERENCES pagos(id),
numero_cuota INT NOT NULL,
monto_cuota DECIMAL(10,2) NOT NULL,
fecha_vencimiento DATE NOT NULL,
estado_cuota tipo_estado_cuota DEFAULT 'pendiente'
);

CREATE TABLE envios (
id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
pedido_id INT REFERENCES pedidos(id),
chofer_id INT REFERENCES usuarios(id),
foto_evidencia_url VARCHAR(255),
latitud_destino DECIMAL(10, 8),
longitud_destino DECIMAL(11, 8),
fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE historial_ubicaciones (
id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
envio_id INT REFERENCES envios(id),
latitud DECIMAL(10, 8) NOT NULL,
longitud DECIMAL(11, 8) NOT NULL,
fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE devoluciones (
id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
pedido_id INT REFERENCES pedidos(id),
motivo_devolucion TEXT NOT NULL,
foto_factura_url VARCHAR(255) NOT NULL,
estado_devolucion tipo_estado_devolucion DEFAULT 'pendiente',
fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
observaciones_admin TEXT
);

CREATE INDEX idx_usuarios_correo ON usuarios(correo_electronico);
CREATE INDEX idx_productos_nombre ON productos(nombre);
CREATE INDEX idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX idx_envios_estado ON pedidos(estado);

ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalles_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cronograma_cuotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.envios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historial_ubicaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devoluciones ENABLE ROW LEVEL SECURITY;

ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_usuario_id_fkey;
ALTER TABLE envios DROP CONSTRAINT IF EXISTS envios_chofer_id_fkey;
ALTER TABLE detalles_pedido DROP CONSTRAINT IF EXISTS detalles_pedido_pedido_id_fkey;
ALTER TABLE pagos DROP CONSTRAINT IF EXISTS pagos_pedido_id_fkey;
ALTER TABLE devoluciones DROP CONSTRAINT IF EXISTS devoluciones_pedido_id_fkey;
ALTER TABLE usuarios ALTER COLUMN id DROP IDENTITY IF EXISTS;
ALTER TABLE usuarios ALTER COLUMN id TYPE UUID USING gen_random_uuid();
ALTER TABLE pedidos ALTER COLUMN usuario_id TYPE UUID USING NULL::uuid;
ALTER TABLE envios ALTER COLUMN chofer_id TYPE UUID USING NULL::uuid;
ALTER TABLE usuarios DROP COLUMN IF EXISTS password;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE;
ALTER TABLE pedidos ADD CONSTRAINT pedidos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES usuarios (id);
ALTER TABLE envios ADD CONSTRAINT envios_chofer_id_fkey FOREIGN KEY (chofer_id) REFERENCES usuarios (id);

CREATE OR REPLACE FUNCTION es_admin()
RETURNS BOOLEAN AS $$
SELECT EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol = 'administrador');
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE POLICY "Ver categorias publicas" ON categorias FOR SELECT USING (true);
CREATE POLICY "Ver productos publicos" ON productos FOR SELECT USING (true);
CREATE POLICY "Clientes ven sus propios datos" ON usuarios FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Clientes ven sus propios pedidos" ON pedidos FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Clientes crean sus propios pedidos" ON pedidos FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Clientes ven sus detalles de pedido" ON detalles_pedido FOR SELECT
USING (EXISTS (SELECT 1 FROM pedidos WHERE pedidos.id = detalles_pedido.pedido_id AND pedidos.usuario_id = auth.uid()));
CREATE POLICY "Clientes ven sus propios pagos" ON pagos FOR SELECT
USING (EXISTS (SELECT 1 FROM pedidos WHERE pedidos.id = pagos.pedido_id AND pedidos.usuario_id = auth.uid()));
CREATE POLICY "Clientes ven su cronograma de cuotas" ON cronograma_cuotas FOR SELECT
USING (EXISTS (SELECT 1 FROM pagos JOIN pedidos ON pagos.pedido_id = pedidos.id WHERE pagos.id = cronograma_cuotas.pago_id AND pedidos.usuario_id = auth.uid()));
CREATE POLICY "Clientes ven sus devoluciones" ON devoluciones FOR SELECT
USING (EXISTS (SELECT 1 FROM pedidos WHERE pedidos.id = devoluciones.pedido_id AND pedidos.usuario_id = auth.uid()));

CREATE POLICY "Choferes ven sus envios asignados" ON envios FOR SELECT USING (auth.uid() = chofer_id);
CREATE POLICY "Choferes insertan historial de ubicacion" ON historial_ubicaciones FOR INSERT WITH CHECK (
EXISTS (SELECT 1 FROM envios WHERE envios.id = historial_ubicaciones.envio_id AND envios.chofer_id = auth.uid())
);

CREATE POLICY "Admin acceso total productos" ON productos FOR ALL USING (es_admin());
CREATE POLICY "Admin acceso total pedidos" ON pedidos FOR ALL USING (es_admin());
CREATE POLICY "Admin acceso total pagos" ON pagos FOR ALL USING (es_admin());
CREATE POLICY "Admin acceso total devoluciones" ON devoluciones FOR ALL USING (es_admin());

CREATE OR REPLACE FUNCTION public.crear_usuario_nuevo()
RETURNS trigger AS $$
BEGIN
INSERT INTO public.usuarios (id, nombre_completo, correo_electronico, rol)
VALUES (
NEW.id,
COALESCE(NEW.raw_user_meta_data->>'nombre_completo', 'Usuario Nuevo'),
NEW.email,
'cliente'
);
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION public.actualizar_stock_por_pago()
RETURNS trigger AS $$
BEGIN
IF (NEW.estado_pago = 'pagado' AND OLD.estado_pago != 'pagado') THEN
UPDATE public.productos
SET stock_disponible = stock_disponible - dp.cantidad
FROM public.detalles_pedido dp
WHERE dp.pedido_id = NEW.pedido_id AND public.productos.id = dp.producto_id;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION public.validar_tiempo_devolucion()
RETURNS trigger AS $$
DECLARE
fecha_entrega_pedido TIMESTAMP;
BEGIN
SELECT fecha_entrega_final INTO fecha_entrega_pedido
FROM public.pedidos
WHERE id = NEW.pedido_id;

IF (fecha_entrega_pedido IS NOT NULL AND (now() - fecha_entrega_pedido) > interval '24 hours') THEN
RAISE EXCEPTION 'El plazo para devoluciones (24 horas) ha expirado.';
END IF;

RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION public.validar_stock_antes_de_insertar()
RETURNS trigger AS $$
DECLARE
stock_actual INT;
BEGIN
SELECT stock_disponible INTO stock_actual
FROM public.productos
WHERE id = NEW.producto_id;

IF (stock_actual < NEW.cantidad) THEN
RAISE EXCEPTION 'Stock insuficiente para el producto seleccionado.';
END IF;

RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION seleccionar_productos_por_categoria(categoria_nombre VARCHAR)
RETURNS TABLE (
    id_producto INT,
    nombre_producto VARCHAR,
    descripcion_producto TEXT,
    precio_actual DECIMAL,
    stock_disponible INT,
    url_imagen VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id AS id_producto,
        p.nombre AS nombre_producto,
        p.descripcion AS descripcion_producto,
        p.precio_actual,
        p.stock_disponible,
        p.url_imagen
    FROM productos p
    INNER JOIN categorias c ON p.categoria_id = c.id
    WHERE c.nombre = categoria_nombre
      AND p.estado = 'activo';
END;
$$ LANGUAGE plpgsql;
