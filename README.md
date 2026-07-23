# stenbox

SaaS fullstack multi-empresa para inventario y caja/libro diario.

## Stack

- **Backend:** Node.js v24, Express, MySQL (mysql2), JWT, bcrypt, dotenv, cors
- **Frontend:** React + Vite, React Router v6, Axios, Context API

## Multi-tenancy

El JWT incluye `id_empresa`, `id_rol` e `id` del usuario. Cada consulta filtra por `id_empresa` extraído del token, garantizando aislamiento de datos entre empresas sin necesidad de subdominios ni bases de datos separadas.

## Roles

| id_rol | nombre     | Permisos                                     |
| ------ | ---------- | -------------------------------------------- |
| 1      | superadmin | Todo: gestión de empresas, usuarios, módulos |
| 2      | admin      | CRUD productos, caja — dentro de su empresa  |
| 3      | cajero     | Lectura de inventario, registro de caja      |

## Estructura

```
stenbox/
├── backend/
│   ├── src/
│   │   ├── config/        # db.js, schema.sql
│   │   ├── middlewares/   # auth.middleware.js
│   │   ├── routes/        # auth, empresa, producto, caja
│   │   ├── controllers/   # lógica de cada módulo
│   │   └── app.js
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/           # axios.js con interceptores
    │   ├── context/       # AuthContext.jsx
    │   ├── components/    # ProtectedRoute, Navbar
    │   └── pages/         # Login, Inventario, Caja, AdminEmpresas
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## Puesta en marcha

### Base de datos

```sql
-- Ejecutar en MySQL:
source backend/src/config/schema.sql
```

### Backend

```bash
cd backend
copy .env.example .env
# Editar .env con tus credenciales MySQL y JWT_SECRET
npm install
npm run dev
# Corre en http://localhost:3000
```

### Frontend

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
# Corre en http://localhost:5173
```

### Crear primer superadmin (SQL directo)

```sql
INSERT INTO empresa (nombre, estado) VALUES ('Mi Empresa', 'activo');

INSERT INTO usuario (id_empresa, id_rol, nombre, apellido, email, password)
VALUES (1, 1, 'Super', 'Admin', 'admin@ejemplo.com',
  '$2b$10$...');  -- Generar hash con bcrypt.hashSync('tu_password', 10)
```

O usar un script temporal en Node:

```js
const bcrypt = require("bcrypt");
console.log(bcrypt.hashSync("tu_password_aqui", 10));
```

## API Endpoints

| Método | Ruta                               | Auth       | Descripción                 |
| ------ | ---------------------------------- | ---------- | --------------------------- |
| POST   | /api/auth/login                    | Libre      | Login, devuelve JWT         |
| GET    | /api/productos                     | Token      | Listar productos de empresa |
| POST   | /api/productos                     | admin+     | Crear producto              |
| PUT    | /api/productos/:id                 | admin+     | Actualizar producto         |
| DELETE | /api/productos/:id                 | admin+     | Eliminar producto           |
| GET    | /api/caja                          | Token      | Listar movimientos          |
| GET    | /api/caja/resumen                  | Token      | Totales ingresos/egresos    |
| POST   | /api/caja                          | Token      | Registrar movimiento        |
| GET    | /api/empresas                      | superadmin | Listar empresas             |
| POST   | /api/empresas                      | superadmin | Crear empresa               |
| PUT    | /api/empresas/:id                  | superadmin | Actualizar empresa          |
| DELETE | /api/empresas/:id                  | superadmin | Eliminar empresa            |
| POST   | /api/empresas/:id_empresa/usuarios | superadmin | Crear usuario en empresa    |

## Para correr ngrok

ngrok http 5173
