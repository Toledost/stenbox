-- Ejecutar en MySQL Workbench
-- Tipos de movimiento personalizables por empresa

CREATE TABLE IF NOT EXISTS tipo_movimiento (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_empresa INT NOT NULL,
  nombre VARCHAR(60) NOT NULL,
  label VARCHAR(80) NOT NULL,
  es_entrada TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1=ingreso, 0=egreso',
  afecta_stock TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1=modifica stock del producto seleccionado',
  activo TINYINT(1) NOT NULL DEFAULT 1,
  orden INT NOT NULL DEFAULT 0,
  UNIQUE KEY uq_tipo_empresa_nombre (id_empresa, nombre),
  FOREIGN KEY (id_empresa) REFERENCES empresa(id) ON DELETE CASCADE
);

-- Agregar columna id_tipo_movimiento a caja_movimiento (nullable para retrocompatibilidad)
ALTER TABLE caja_movimiento ADD COLUMN id_tipo_movimiento INT NULL;
ALTER TABLE caja_movimiento ADD FOREIGN KEY (id_tipo_movimiento) REFERENCES tipo_movimiento(id) ON DELETE SET NULL;
