-- Módulo Turnero: Profesionales, Pacientes, Configuración de Agenda y Turnos

-- Registrar módulo
INSERT IGNORE INTO modulo (nombre, label) VALUES ('turnero', 'Turnos / Agenda');

-- Profesionales por empresa (lista configurable)
CREATE TABLE IF NOT EXISTS profesional (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_empresa INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  especialidad VARCHAR(100),
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_empresa) REFERENCES empresa(id) ON DELETE CASCADE
);

-- Pacientes por empresa
CREATE TABLE IF NOT EXISTS paciente (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_empresa INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  dni VARCHAR(20),
  telefono VARCHAR(30),
  email VARCHAR(100),
  fecha_nacimiento DATE,
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_empresa) REFERENCES empresa(id) ON DELETE CASCADE
);

-- Configuración de agenda: bloques horarios por profesional y día de la semana
-- dia_semana: 0=Lunes, 1=Martes, ... 6=Domingo
CREATE TABLE IF NOT EXISTS agenda_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_empresa INT NOT NULL,
  id_profesional INT NOT NULL,
  dia_semana TINYINT NOT NULL COMMENT '0=Lunes, 6=Domingo',
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  duracion_turno INT NOT NULL DEFAULT 30 COMMENT 'minutos por turno',
  activo TINYINT(1) NOT NULL DEFAULT 1,
  FOREIGN KEY (id_empresa) REFERENCES empresa(id) ON DELETE CASCADE,
  FOREIGN KEY (id_profesional) REFERENCES profesional(id) ON DELETE CASCADE
);

-- Turnos: cada slot de tiempo asignado (o no) a un paciente
CREATE TABLE IF NOT EXISTS turno (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_empresa INT NOT NULL,
  id_profesional INT NOT NULL,
  id_paciente INT,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  estado ENUM('disponible', 'reservado', 'completado', 'cancelado') NOT NULL DEFAULT 'disponible',
  notas TEXT,
  id_usuario_registro INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_turno (id_empresa, id_profesional, fecha, hora_inicio),
  FOREIGN KEY (id_empresa) REFERENCES empresa(id) ON DELETE CASCADE,
  FOREIGN KEY (id_profesional) REFERENCES profesional(id) ON DELETE CASCADE,
  FOREIGN KEY (id_paciente) REFERENCES paciente(id) ON DELETE SET NULL,
  FOREIGN KEY (id_usuario_registro) REFERENCES usuario(id) ON DELETE SET NULL
);
