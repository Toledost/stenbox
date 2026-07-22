-- Migración: sistema de módulos por usuario
USE stenbox_db;

CREATE TABLE IF NOT EXISTS modulo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    label VARCHAR(100) NOT NULL
);

INSERT IGNORE INTO modulo (nombre, label) VALUES
    ('inventario', 'Inventario'),
    ('caja', 'Caja / Libro Diario');

CREATE TABLE IF NOT EXISTS usuario_modulo (
    id_usuario INT NOT NULL,
    id_modulo INT NOT NULL,
    PRIMARY KEY (id_usuario, id_modulo),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (id_modulo) REFERENCES modulo(id) ON DELETE CASCADE
);

-- Dar acceso a todos los módulos a los usuarios existentes
INSERT IGNORE INTO usuario_modulo (id_usuario, id_modulo)
SELECT u.id, m.id FROM usuario u CROSS JOIN modulo m;
