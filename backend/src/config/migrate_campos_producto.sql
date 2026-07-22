-- Campos personalizados por empresa para productos
CREATE TABLE IF NOT EXISTS campo_producto (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_empresa INT NOT NULL,
  nombre VARCHAR(60) NOT NULL,           -- clave interna (ej: "origen")
  label VARCHAR(80) NOT NULL,            -- etiqueta visible (ej: "Origen")
  tipo ENUM('text','number','select') NOT NULL DEFAULT 'text',
  opciones JSON NULL,                    -- solo para tipo=select: ["Vacuno","Cerdo","Pollo"]
  requerido TINYINT(1) NOT NULL DEFAULT 0,
  orden INT NOT NULL DEFAULT 0,
  UNIQUE KEY uq_campo_empresa_nombre (id_empresa, nombre),
  FOREIGN KEY (id_empresa) REFERENCES empresa(id) ON DELETE CASCADE
);

-- Valores de los campos personalizados por producto
CREATE TABLE IF NOT EXISTS producto_atributo (
  id_producto INT NOT NULL,
  id_campo INT NOT NULL,
  valor TEXT NULL,
  PRIMARY KEY (id_producto, id_campo),
  FOREIGN KEY (id_producto) REFERENCES producto(id) ON DELETE CASCADE,
  FOREIGN KEY (id_campo) REFERENCES campo_producto(id) ON DELETE CASCADE
);

-- Unidad de medida configurable por empresa (para stock y cantidades en caja)
ALTER TABLE empresa ADD COLUMN unidad_stock VARCHAR(20) NOT NULL DEFAULT 'kg';
