-- Migración: agregar columna username a usuario
USE stenbox_db;

ALTER TABLE usuario ADD COLUMN username VARCHAR(50) UNIQUE AFTER email;

-- Poblar username desde email (parte antes del @) para usuarios existentes
UPDATE usuario SET username = SUBSTRING_INDEX(email, '@', 1)
WHERE username IS NULL;

-- Hacer username NOT NULL una vez poblado
ALTER TABLE usuario MODIFY username VARCHAR(50) UNIQUE NOT NULL;
