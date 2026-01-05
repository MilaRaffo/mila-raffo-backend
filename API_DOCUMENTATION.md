# Mila Raffo Store API - Documentación

## Descripción General
API REST para la tienda de artículos de cuero Mila Raffo. Construida con NestJS, TypeORM y PostgreSQL.

## Documentación Interactiva (Swagger)

Una vez que el servidor esté en ejecución, puedes acceder a la documentación interactiva de Swagger en:

```
http://localhost:3000/api/docs
```

Esta interfaz te permite:
- Explorar todos los endpoints disponibles
- Ver los esquemas de entrada y salida
- Probar los endpoints directamente desde el navegador
- Autenticarte usando el botón "Authorize"

## URL Base

```
http://localhost:3000/api/v1
```

## Autenticación

La API utiliza **JWT (JSON Web Tokens)** para la autenticación. La mayoría de los endpoints requieren un token de acceso.

### Headers de Autenticación

```
Authorization: Bearer <access_token>
```

### Tokens

- **Access Token**: Válido por 24 horas
- **Refresh Token**: Válido por 14 días

## Roles y Permisos

La API implementa un sistema de roles jerárquico:

### Roles Disponibles

1. **CLIENT** (cliente)
   - Rol predeterminado para nuevos registros
   - Acceso básico a la aplicación
   - Puede ver productos, categorías, etc.

2. **ADMIN** (administrador)
   - Gestión de productos, categorías, variantes
   - Gestión de usuarios clientes
   - **NO puede**: gestionar roles ni otros admins

3. **SUPERADMIN** (super administrador)
   - Acceso total al sistema
   - Gestión de roles
   - Gestión de todos los usuarios (incluyendo admins)

### Credenciales Predeterminadas del Superadmin

```
Email: superadmin@milaraffo.com
Password: SuperAdmin123!
```

**⚠️ IMPORTANTE**: Cambiar estas credenciales en producción mediante variables de entorno.

## Módulos de la API

### 🔐 Autenticación (`/auth`)

Gestión de autenticación y autorización de usuarios.

#### Endpoints Públicos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/register` | Registrar nuevo usuario (rol CLIENT) |
| POST | `/auth/login` | Login de usuario |
| POST | `/auth/admin/login` | Login para panel admin (solo ADMIN/SUPERADMIN) |

#### Endpoints Protegidos

| Método | Endpoint | Rol Requerido | Descripción |
|--------|----------|---------------|-------------|
| POST | `/auth/logout` | Autenticado | Cerrar sesión e invalidar tokens |
| POST | `/auth/refresh` | Autenticado | Refrescar access token |

**Sistema de Blacklist**: Los tokens invalidados se almacenan en una lista negra con limpieza automática diaria a las 3:00 AM.

---

### 👥 Roles (`/roles`)

Gestión de roles del sistema (solo SUPERADMIN).

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/roles` | Crear nuevo rol |
| GET | `/roles` | Listar todos los roles |
| GET | `/roles/:id` | Obtener rol por ID |
| PATCH | `/roles/:id` | Actualizar rol |
| DELETE | `/roles/:id` | Eliminar rol |

**Restricciones**:
- Todos los endpoints requieren rol SUPERADMIN
- No se puede eliminar un rol con usuarios asociados

---

### 👤 Usuarios (`/users`)

Gestión de usuarios (ADMIN y SUPERADMIN).

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/users` | Crear nuevo usuario |
| GET | `/users` | Listar usuarios (paginado) |
| GET | `/users/:id` | Obtener usuario por ID |
| PATCH | `/users/:id` | Actualizar usuario |
| DELETE | `/users/:id` | Soft delete de usuario |

**Restricciones de ADMIN**:
- No puede modificar usuarios ADMIN o SUPERADMIN
- No puede eliminar usuarios ADMIN o SUPERADMIN

---

### 📦 Productos (`/products`)

Catálogo de productos.

#### Endpoints Públicos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/products` | Listar productos (paginado) |
| GET | `/products/:id` | Obtener producto por ID |
| GET | `/products/:id/variants` | Obtener variantes del producto |
| GET | `/products/:id/characteristics` | Obtener características del producto |

#### Endpoints Protegidos (ADMIN)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/products` | Crear producto |
| PATCH | `/products/:id` | Actualizar producto |
| DELETE | `/products/:id` | Soft delete de producto |

---

### 🎨 Variantes (`/variants`)

Variantes de productos (color, tamaño, SKU).

#### Endpoints Públicos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/variants` | Listar variantes (paginado) |
| GET | `/variants/:id` | Obtener variante por ID |

#### Endpoints Protegidos (ADMIN)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/variants` | Crear variante |
| POST | `/variants/:id/leathers` | Agregar cueros a variante |
| DELETE | `/variants/:id/leathers/:leatherId` | Quitar cuero de variante |
| PATCH | `/variants/:id` | Actualizar variante |
| DELETE | `/variants/:id` | Soft delete de variante |

---

### 📂 Categorías (`/categories`)

Jerarquía de categorías de productos.

#### Endpoints Públicos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/categories` | Listar categorías (paginado) |
| GET | `/categories/tree` | Obtener árbol jerárquico de categorías |
| GET | `/categories/:id` | Obtener categoría por ID |
| GET | `/categories/:id/products` | Obtener productos de una categoría |

#### Endpoints Protegidos (ADMIN)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/categories` | Crear categoría |
| PATCH | `/categories/:id` | Actualizar categoría |
| DELETE | `/categories/:id` | Soft delete de categoría |

---

### ✨ Características (`/characteristics`)

Características de productos (dimensiones, peso, etc.).

#### Endpoints Públicos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/characteristics` | Listar características (paginado) |
| GET | `/characteristics/:id` | Obtener característica por ID |

#### Endpoints Protegidos (ADMIN)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/characteristics` | Crear característica |
| PATCH | `/characteristics/:id` | Actualizar característica |
| DELETE | `/characteristics/:id` | Soft delete de característica |

---

### 🧳 Cueros (`/leathers`)

Tipos de cuero disponibles.

#### Endpoints Públicos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/leathers` | Listar cueros (paginado) |
| GET | `/leathers/:id` | Obtener cuero por ID |

#### Endpoints Protegidos (ADMIN)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/leathers` | Crear tipo de cuero |
| PATCH | `/leathers/:id` | Actualizar cuero |
| DELETE | `/leathers/:id` | Soft delete de cuero |

---

### 🖼️ Imágenes (`/images`)

Gestión de imágenes de productos (integración con AWS S3).

#### Endpoints Públicos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/images` | Listar imágenes (paginado) |
| GET | `/images/:id` | Obtener imagen por ID |
| GET | `/images/variant/:variantId` | Obtener imágenes de una variante |

#### Endpoints Protegidos (ADMIN)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/images` | Crear registro de imagen |
| POST | `/images/upload` | Subir archivo de imagen a S3 |
| PATCH | `/images/:id` | Actualizar imagen |
| DELETE | `/images/:id` | Soft delete de imagen |

**Configuración S3**: Ver `S3_SETUP.md` para configuración de AWS.

---

## Paginación

Los endpoints que devuelven listas soportan paginación mediante query parameters:

```
GET /api/v1/products?page=1&limit=10
```

### Parámetros

- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Elementos por página (default: 10)

### Respuesta Paginada

```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

---

## Códigos de Estado HTTP

| Código | Significado |
|--------|-------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado exitosamente |
| 400 | Bad Request - Datos de entrada inválidos |
| 401 | Unauthorized - Token inválido o ausente |
| 403 | Forbidden - Sin permisos suficientes |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Recurso duplicado (ej: email ya existe) |
| 500 | Internal Server Error - Error del servidor |

---

## Validación de Datos

La API valida automáticamente todos los datos de entrada usando `class-validator`.

### Reglas Comunes

- **Email**: Debe ser formato válido
- **Password**: Mínimo 8 caracteres
- **Nombres**: 2-100 caracteres
- **UUIDs**: Formato UUID v4 válido

### Ejemplo de Error de Validación

```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 8 characters"
  ],
  "error": "Bad Request"
}
```

---

## Seguridad

### Token Blacklist

Los tokens se invalidan en los siguientes casos:
- Logout manual del usuario
- Cambio de contraseña
- Violación de seguridad
- Revocación manual

Los tokens blacklisteados se almacenan en la base de datos y se verifican en cada request.

### Limpieza Automática

Un job cron ejecuta limpieza automática de tokens expirados:
- **Frecuencia**: Diaria a las 3:00 AM
- **Acción**: Elimina tokens blacklisteados que ya expiraron

---

## Rate Limiting

La API implementa throttling para prevenir abuso:

- **TTL**: 60 segundos
- **Límite**: 10 requests por TTL

Configurables mediante variables de entorno `THROTTLE_TTL` y `THROTTLE_LIMIT`.

---

## Variables de Entorno

Archivo `.env` requerido:

```env
# Application
NODE_ENV=production
PORT=3000
API_PREFIX=api/v1

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=mila_raffo_store

# JWT
JWT_SECRET=your-secret-key

# Superadmin
SUPERADMIN_EMAIL=superadmin@milaraffo.com
SUPERADMIN_PASSWORD=SuperAdmin123!

# CORS
CORS_ORIGIN=*

# File Upload
MAX_FILE_SIZE=5242880

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=10

# S3
AWS_S3_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

---

## Inicialización

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Base de Datos

Crear base de datos PostgreSQL y configurar `.env`

### 3. Ejecutar Seed

Crea roles y usuario superadmin:

```bash
npm run seed
```

### 4. Iniciar Servidor

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

---

## Ejemplos de Uso

Ver archivo `API_EXAMPLES.md` para ejemplos detallados de cada endpoint.

---

## Soporte y Documentación Adicional

- **Swagger UI**: `http://localhost:3000/api/docs`
- **Guía de Roles**: `ROLES_GUIDE.md`
- **Guía de Blacklist**: `TOKEN_BLACKLIST_GUIDE.md`
- **Setup S3**: `S3_SETUP.md`
- **Docker**: `DOCKER.md`

---

## Licencia

UNLICENSED - Uso privado
