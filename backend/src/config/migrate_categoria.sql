-- Migración: tabla categoria con FK en producto
USE stenbox_db;

-- 1. Crear tabla categoria
CREATE TABLE IF NOT EXISTS categoria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_empresa INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    UNIQUE KEY uq_empresa_nombre (id_empresa, nombre),
    FOREIGN KEY (id_empresa) REFERENCES empresa(id) ON DELETE CASCADE
);

-- 2. Poblar categorias desde los valores existentes en producto
INSERT IGNORE INTO categoria (id_empresa, nombre)
SELECT DISTINCT id_empresa, categoria
FROM producto
WHERE categoria IS NOT NULL AND categoria != '';

-- 3. Agregar columna id_categoria en producto (nullable para no romper filas existentes)
ALTER TABLE producto ADD COLUMN id_categoria INT AFTER id_empresa;

-- 4. Llenar id_categoria basándose en el texto existente
UPDATE producto p
JOIN categoria c ON c.id_empresa = p.id_empresa AND c.nombre = p.categoria
SET p.id_categoria = c.id;

-- 5. Agregar FK
ALTER TABLE producto
    ADD CONSTRAINT fk_producto_categoria
    FOREIGN KEY (id_categoria) REFERENCES categoria(id) ON DELETE SET NULL;

-- 6. Quitar la columna de texto (ya no se necesita)
ALTER TABLE producto DROP COLUMN categoria;
