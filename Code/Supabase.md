# No puedes modificar este archivo, es de solo lectura

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

$$
LANGUAGE sql SECURITY DEFINER SET search_path = public;

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

CREATE TABLE historial_estados_pedido (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pedido_id INT REFERENCES pedidos(id) ON DELETE CASCADE,
  estado tipo_estado_pedido NOT NULL,
  fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.historial_estados_pedido ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura de historial estados"
  ON historial_estados_pedido FOR SELECT USING (true);

CREATE POLICY "Permitir inserción de historial estados"
  ON historial_estados_pedido FOR INSERT WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE pedidos;
ALTER PUBLICATION supabase_realtime ADD TABLE historial_estados_pedido;

CREATE TABLE IF NOT EXISTS public.mensajes_ayuda (
  id                SERIAL PRIMARY KEY,
  usuario_id        UUID REFERENCES public.usuarios(id),
  nombre            VARCHAR(100)       NOT NULL,
  email             VARCHAR(100)       NOT NULL,
  categoria         VARCHAR(50)        NOT NULL,
  mensaje           TEXT               NOT NULL,
  respuesta_admin   TEXT,
  estado            VARCHAR(20)        DEFAULT 'pendiente',
  fecha_creacion    TIMESTAMP          DEFAULT CURRENT_TIMESTAMP,
  fecha_respuesta   TIMESTAMP
);

ALTER TABLE public.mensajes_ayuda ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enviar mensaje ayuda"
  ON public.mensajes_ayuda
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Ver mensajes ayuda"
  ON public.mensajes_ayuda
  FOR SELECT USING (es_admin());

CREATE POLICY "Admin responder mensajes"
  ON public.mensajes_ayuda
  FOR UPDATE USING (es_admin());

CREATE POLICY "Admin eliminar mensaje"
  ON public.mensajes_ayuda
  FOR DELETE USING (es_admin());

CREATE OR REPLACE FUNCTION public.asignar_chofer_por_enviado()
RETURNS trigger AS
$$

DECLARE
chofer RECORD;
BEGIN
IF NEW.estado = 'enviado' THEN
SELECT id INTO chofer
FROM public.usuarios
WHERE rol='chofer'
ORDER BY random()
LIMIT 1;
IF chofer.id IS NOT NULL THEN
INSERT INTO public.envios(pedido_id, chofer_id)
VALUES (NEW.id, chofer.id);
END IF;
END IF;
RETURN NEW;
END;

$$
LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_asignar_chofer ON public.pedidos;
CREATE TRIGGER trg_asignar_chofer
  AFTER INSERT OR UPDATE OF estado ON public.pedidos
  FOR EACH ROW
  WHEN (NEW.estado = 'enviado')
  EXECUTE FUNCTION public.asignar_chofer_por_enviado();

CREATE OR REPLACE FUNCTION public.reasignar_envios_vencidos()
RETURNS void AS
$$

DECLARE
r RECORD;
nuevoChofer RECORD;
BEGIN
FOR r IN
SELECT e.id, e.chofer_id
FROM public.envios e
JOIN public.pedidos p ON p.id=e.pedido_id
WHERE p.estado='enviado'
AND now() - p.fecha_creacion > interval '10 minutes'
LOOP
SELECT id INTO nuevoChofer FROM public.usuarios
WHERE rol='chofer' AND id <> r.chofer_id
ORDER BY random()
LIMIT 1;
IF nuevoChofer.id IS NOT NULL THEN
UPDATE public.envios
SET chofer_id = nuevoChofer.id,
fecha_asignacion = now()
WHERE id = r.id;
END IF;
END LOOP;
END;

$$
LANGUAGE plpgsql SECURITY DEFINER;

SELECT public.reasignar_envios_vencidos();

CREATE OR REPLACE FUNCTION public.crear_usuario_nuevo()
RETURNS trigger AS
$$

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

$$
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION public.actualizar_stock_por_pago()
RETURNS trigger AS
$$

BEGIN
IF (NEW.estado_pago = 'pagado' AND OLD.estado_pago != 'pagado') THEN
UPDATE public.productos
SET stock_disponible = stock_disponible - dp.cantidad
FROM public.detalles_pedido dp
WHERE dp.pedido_id = NEW.pedido_id AND public.productos.id = dp.producto_id;
END IF;
RETURN NEW;
END;

$$
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION public.validar_tiempo_devolucion()
RETURNS trigger AS
$$

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

$$
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION public.validar_stock_antes_de_insertar()
RETURNS trigger AS
$$

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

$$
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION seleccionar_productos_por_categoria(categoria_nombre VARCHAR)
RETURNS TABLE (
    id_producto INT,
    nombre_producto VARCHAR,
    descripcion_producto TEXT,
    precio_actual DECIMAL,
    stock_disponible INT,
    url_imagen VARCHAR
) AS
$$

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

$$
LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.crear_usuario_nuevo()
RETURNS trigger AS
$$

BEGIN
INSERT INTO public.usuarios (id, nombre_completo, correo_electronico, telefono, rol)
VALUES (
NEW.id,
COALESCE(NEW.raw_user_meta_data->>'nombre_completo','Usuario Nuevo'),
NEW.email,
NULLIF(NEW.raw_user_meta_data->>'telefono',''),
COALESCE(NEW.raw_user_meta_data->>'rol','cliente')
);
RETURN NEW;
END;

$$
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.crear_usuario_nuevo();

CREATE OR REPLACE FUNCTION public.crear_usuario_nuevo()
RETURNS trigger AS
$$

BEGIN
INSERT INTO public.usuarios (id, nombre_completo, correo_electronico, telefono, rol)
VALUES (
NEW.id,
COALESCE(NEW.raw_user_meta_data->>'nombre_completo','Usuario Nuevo'),
NEW.email,
NULLIF(NEW.raw_user_meta_data->>'telefono',''),
COALESCE(NEW.raw_user_meta_data->>'rol','cliente')
)
ON CONFLICT (id) DO UPDATE
SET nombre_completo = EXCLUDED.nombre_completo,
correo_electronico = EXCLUDED.correo_electronico,
telefono = COALESCE(EXCLUDED.telefono, public.usuarios.telefono),
rol = EXCLUDED.rol;

RETURN NEW;
EXCEPTION WHEN OTHERS THEN
RAISE NOTICE 'crear_usuario_nuevo() fallo: %', SQLERRM;
RETURN NEW;
END;

$$
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.crear_usuario_nuevo();

CREATE OR REPLACE FUNCTION public.crear_usuario_nuevo()
RETURNS trigger AS
$$

BEGIN
INSERT INTO public.usuarios (id, nombre_completo, correo_electronico, telefono, rol)
VALUES (
NEW.id,
COALESCE(NEW.raw_user_meta_data->>'nombre_completo', 'Usuario Nuevo'),
NEW.email,
NULLIF(NEW.raw_user_meta_data->>'telefono', ''),
COALESCE(NEW.raw_user_meta_data->>'rol', 'cliente')
)
ON CONFLICT (id) DO UPDATE
SET nombre_completo = EXCLUDED.nombre_completo,
correo_electronico = EXCLUDED.correo_electronico,
telefono = COALESCE(EXCLUDED.telefono, public.usuarios.telefono),
rol = EXCLUDED.rol;
RETURN NEW;
EXCEPTION WHEN OTHERS THEN
RAISE NOTICE 'crear_usuario_nuevo() fallo: %', SQLERRM;
RETURN NEW;
END;

$$
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.crear_usuario_nuevo();

CREATE OR REPLACE FUNCTION public.crear_usuario_nuevo()
RETURNS trigger AS
$$

DECLARE
v_nombre text;
v_rol public.tipo_rol;
v_tel text;
BEGIN
v_nombre := COALESCE(NEW.raw_user_meta_data->>'nombre_completo', 'Usuario Nuevo');
v_tel := NULLIF(NEW.raw_user_meta_data->>'telefono', '');

    BEGIN
        v_rol := (COALESCE(NEW.raw_user_meta_data->>'rol', 'cliente'))::public.tipo_rol;
    EXCEPTION WHEN OTHERS THEN
        v_rol := 'cliente'::public.tipo_rol;
    END;

    INSERT INTO public.usuarios (id, nombre_completo, correo_electronico, telefono, rol)
    VALUES (NEW.id, v_nombre, NEW.email, v_tel, v_rol)
    ON CONFLICT (id) DO UPDATE
    SET
        nombre_completo = EXCLUDED.nombre_completo,
        correo_electronico = EXCLUDED.correo_electronico,
        telefono = COALESCE(EXCLUDED.telefono, public.usuarios.telefono),
        rol = EXCLUDED.rol;

    RETURN NEW;

EXCEPTION WHEN OTHERS THEN
RAISE WARNING 'Error en crear_usuario_nuevo: %', SQLERRM;
RETURN NEW;
END;

$$
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.crear_usuario_nuevo();

  INSERT INTO categorias (nombre, descripcion) VALUES
('Hogar', 'Artículos y productos para el hogar.'),
('Oficina', 'Equipamiento y mobiliario para oficinas.'),
('Muebles', 'Muebles para el hogar y la oficina.'),
('Tecnología', 'Televisores, gadgets y equipos de alta tecnología.'),
('Juguetería', 'Juguetes y artículos para niños.'),
('Alimentos y Bebidas', 'Productos de consumo alimenticio y bebidas.'),
('Herramientas', 'Herramientas para construcción, reparación y manualidades.');

INSERT INTO productos (categoria_id, nombre, descripcion, precio_actual, stock_disponible, stock_minimo_alerta, url_imagen, estado) VALUES
((SELECT id FROM categorias WHERE nombre = 'Hogar'),
 'Juego de Sábanas Queen', 'Juego de sábanas 100% algodón, diseño floral.', 299.90, 50, 10, 'https://resources.multicenter.com.bo/products/sabanas-queen.jpg', 'activo'),

((SELECT id FROM categorias WHERE nombre = 'Oficina'),
 'Silla de Oficina GREGOR Negra', 'Silla ergonómica con ajuste de altura y base con ruedas.', 489.90, 30, 5, 'https://resources.multicenter.com.bo/products/silla-gregor.jpg', 'activo'),

((SELECT id FROM categorias WHERE nombre = 'Muebles'),
 'Set Dallas 2 Poltronas + Puff', 'Dos poltronas y un puff tapizados en tela gris.', 1999.00, 10, 2, 'https://resources.multicenter.com.bo/products/set-dallas.jpg', 'activo'),

((SELECT id FROM categorias WHERE nombre = 'Tecnología'),
 'Smart TV LG 43" 4K UHD', 'Televisor de 43 pulgadas con resolución 4K y ThinQ AI.', 3299.00, 15, 3, 'https://resources.multicenter.com.bo/products/lg-43-4k.jpg', 'activo'),

((SELECT id FROM categorias WHERE nombre = 'Juguetería'),
 'Auto Control Remoto 1:16 Rastar', 'Carro a control remoto escala 1:16 con diseño deportivo.', 369.00, 20, 5, 'https://resources.multicenter.com.bo/products/auto-rc.jpg', 'activo'),

((SELECT id FROM categorias WHERE nombre = 'Alimentos y Bebidas'),
 'Soda Sprite 2L', 'Soda gaseosa refrescante de limón en presentación de 2 litros.', 12.50, 100, 15, 'https://resources.multicenter.com.bo/products/sprite-2l.jpg', 'activo'),

((SELECT id FROM categorias WHERE nombre = 'Herramientas'),
 'Taladro Percutor Bosch GSB 550', 'Taladro de impacto Bosch de 550W con accesorios incluidos.', 599.00, 25, 5, 'https://resources.multicenter.com.bo/products/taladro-percutor.jpg', 'activo');


$$

CREATE POLICY "Choferes ven pedidos asignados"
ON public.pedidos FOR SELECT
USING (EXISTS (SELECT 1 FROM public.envios WHERE envios.pedido_id = pedidos.id AND envios.chofer_id = auth.uid()));

CREATE POLICY "Choferes ven datos de sus clientes"
ON public.usuarios FOR SELECT
USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.pedidos p JOIN public.envios e ON e.pedido_id = p.id WHERE p.usuario_id = usuarios.id AND e.chofer_id = auth.uid()));

CREATE POLICY "Admin acceso total envios" ON public.envios FOR ALL USING (es_admin());
CREATE POLICY "Admin acceso total usuarios" ON public.usuarios FOR ALL USING (es_admin());

DROP POLICY IF EXISTS "Ver mensajes ayuda" ON public.mensajes_ayuda;
CREATE POLICY "Ver mensajes ayuda" ON public.mensajes_ayuda FOR SELECT USING (es_admin() OR auth.uid() = usuario_id);

DROP TRIGGER IF EXISTS trg_asignar_chofer ON public.pedidos;
CREATE OR REPLACE FUNCTION public.asignar_chofer_por_enviado() RETURNS trigger AS $$ DECLARE chofer RECORD; BEGIN IF NEW.estado = 'enviado' THEN IF NOT EXISTS (SELECT 1 FROM public.envios WHERE pedido_id = NEW.id) THEN SELECT id INTO chofer FROM public.usuarios WHERE rol = 'chofer' ORDER BY random() LIMIT 1; IF chofer.id IS NOT NULL THEN INSERT INTO public.envios (pedido_id, chofer_id) VALUES (NEW.id, chofer.id); END IF; END IF; END IF; RETURN NEW; END; $$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER trg_asignar_chofer AFTER INSERT OR UPDATE OF estado ON public.pedidos FOR EACH ROW WHEN (NEW.estado = 'enviado') EXECUTE FUNCTION public.asignar_chofer_por_enviado();
