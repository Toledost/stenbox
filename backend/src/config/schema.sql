CREATE DATABASE IF NOT EXISTS stenbox_db;
USE stenbox_db;

CREATE TABLE IF NOT EXISTS empresa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    estado ENUM('activo', 'inactivo', 'prueba') DEFAULT 'prueba',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rol (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_empresa INT,
    id_rol INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_empresa) REFERENCES empresa(id) ON DELETE CASCADE,
    FOREIGN KEY (id_rol) REFERENCES rol(id)
);

CREATE TABLE IF NOT EXISTS producto (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_empresa INT NOT NULL,
    codigo VARCHAR(50),
    nombre VARCHAR(100) NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 0,
    FOREIGN KEY (id_empresa) REFERENCES empresa(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS caja_movimiento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_empresa INT NOT NULL,
    id_usuario INT NOT NULL,
    tipo ENUM('ingreso', 'egreso') NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    descripcion TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_empresa) REFERENCES empresa(id) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id)
);

INSERT INTO rol (id, nombre) VALUES (1, 'superadmin'), (2, 'admin'), (3, 'cajero')
ON DUPLICATE KEY UPDATE id=id;
