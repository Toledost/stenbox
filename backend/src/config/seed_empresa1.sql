-- ============================================================
-- PASO 1: Adaptar tabla producto (si ya existe en tu DB)
-- ============================================================
ALTER TABLE producto MODIFY COLUMN stock DECIMAL(10,3) DEFAULT 0;
ALTER TABLE producto ADD COLUMN categoria VARCHAR(100) AFTER nombre;


-- ============================================================
-- PASO 2: Insertar empresa 1 (carnicería) si no existe
-- ============================================================
INSERT INTO empresa (id, nombre, estado) VALUES (1, 'Carnicería', 'activo')
ON DUPLICATE KEY UPDATE nombre=nombre;

-- ============================================================
-- PASO 3: Productos empresa 1 (Carnicería)
-- Fuente: Gestion Inventario.xlsx — hoja Inventario
-- Stock en 0 (base limpia); precio x kg en ARS
-- ============================================================
INSERT INTO producto (id_empresa, codigo, nombre, categoria, precio, stock) VALUES
-- Vacuno
(1, 'V001', 'Costilla',           'Vacuno',   21500.00, 0),
(1, 'V002', 'Vacío',              'Vacuno',   22500.00, 0),
(1, 'V003', 'Matambre',           'Vacuno',   24000.00, 0),
(1, 'V004', 'Entraña',            'Vacuno',   22000.00, 0),
(1, 'V005', 'Tapa de asado',      'Vacuno',   18000.00, 0),
(1, 'V006', 'Tapa de nalga',      'Vacuno',   21000.00, 0),
(1, 'V007', 'Picaña',             'Vacuno',   21000.00, 0),
(1, 'V008', 'Entrecot',           'Vacuno',   19000.00, 0),
(1, 'V009', 'Falda',              'Vacuno',   18500.00, 0),
(1, 'V010', 'Araña',              'Vacuno',   16000.00, 0),
(1, 'V011', 'Bocado ancho',       'Vacuno',   17500.00, 0),
(1, 'V012', 'Bocado fino',        'Vacuno',   13500.00, 0),
(1, 'V013', 'Nalga',              'Vacuno',   21500.00, 0),
(1, 'V014', 'Peceto',             'Vacuno',   22000.00, 0),
(1, 'V015', 'Bola de lomo',       'Vacuno',   21000.00, 0),
(1, 'V016', 'Jamón cuadrado',     'Vacuno',   20000.00, 0),
(1, 'V017', 'Cuadril',            'Vacuno',   22000.00, 0),
(1, 'V018', 'Colita de cuadril',  'Vacuno',   22000.00, 0),
(1, 'V019', 'Costeletas',         'Vacuno',   17500.00, 0),
(1, 'V020', 'Aguja',              'Vacuno',   14000.00, 0),
(1, 'V021', 'Paleta',             'Vacuno',   18000.00, 0),
(1, 'V022', 'Tortuguita',         'Vacuno',   18000.00, 0),
(1, 'V023', 'Molida',             'Vacuno',   14000.00, 0),
(1, 'V024', 'Osobuco',            'Vacuno',   13500.00, 0),
(1, 'V025', 'Puchero',            'Vacuno',   10000.00, 0),
(1, 'V026', 'Milanesa',           'Vacuno',   18000.00, 0),
(1, 'V027', 'Chorizo',            'Vacuno',   12000.00, 0),
(1, 'V028', 'Morcilla',           'Vacuno',    8000.00, 0),
(1, 'V029', 'Chorizo criollo',    'Vacuno',    8500.00, 0),
(1, 'V030', 'Salchicha parrillera','Vacuno',  13000.00, 0),
-- Cerdo
(1, 'C001', 'Costillas',          'Cerdo',    12000.00, 0),
(1, 'C002', 'Costeletas',         'Cerdo',    18000.00, 0),
(1, 'C003', 'Matambre',           'Cerdo',    15000.00, 0),
(1, 'C004', 'Vacío',              'Cerdo',    12000.00, 0),
-- Parrilla / Achuras
(1, 'P001', 'Riñón',              'Parrilla',  8500.00, 0),
(1, 'P002', 'Corazón',            'Parrilla',  9000.00, 0),
(1, 'P003', 'Chinchulín',         'Parrilla',  8000.00, 0),
(1, 'P004', 'Entraña dulce',      'Parrilla', 11000.00, 0),
(1, 'P005', 'Hígado',             'Parrilla',  5000.00, 0),
(1, 'P006', 'Mondongo',           'Parrilla',  8500.00, 0);
