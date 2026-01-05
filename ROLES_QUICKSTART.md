# Quick Start - Sistema de Roles

## 🚀 Setup Rápido

### 1️⃣ Ejecutar el Seed (OBLIGATORIO)

```bash
npm run seed
```

Esto crea:
- ✅ 3 roles: `client`, `admin`, `superadmin`
- ✅ Usuario superadmin con credenciales:
  - **Email**: `superadmin@milaraffo.com`
  - **Password**: `SuperAdmin123!`

### 2️⃣ Login Admin Panel

**Endpoint para panel de admin**: `POST /auth/admin/login`

```json
{
  "email": "superadmin@milaraffo.com",
  "password": "SuperAdmin123!"
}
```

**Respuesta**:
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "superadmin@milaraffo.com",
    "name": "Super",
    "lastName": "Admin",
    "role": {
      "id": "uuid",
      "name": "superadmin"
    }
  }
}
```

## 📋 Diferencias entre Endpoints de Login

| Endpoint | Permite | Uso |
|----------|---------|-----|
| `POST /auth/login` | Todos los roles (client, admin, superadmin) | App cliente |
| `POST /auth/admin/login` | Solo admin y superadmin | Panel de administración |

## 🔐 Permisos por Rol

### CLIENT
- ✅ Ver productos, categorías, etc.
- ❌ No puede crear/modificar/eliminar nada

### ADMIN
- ✅ Gestionar productos, categorías, variantes, etc.
- ✅ Gestionar usuarios CLIENT (crear, ver, editar, eliminar)
- ❌ **NO puede gestionar roles**
- ❌ **NO puede crear/editar/eliminar ADMIN o SUPERADMIN**

### SUPERADMIN
- ✅ **Acceso total a todo**
- ✅ Puede gestionar roles
- ✅ Puede gestionar todos los usuarios

## 🛠️ Comandos Útiles

```bash
# Ejecutar seed
npm run seed

# Ejecutar en desarrollo
npm run start:dev

# Build para producción
npm run build
npm run start:prod
```

## 📝 Crear un Nuevo Admin

**1. Login como SUPERADMIN**

**2. Obtener ID del rol admin**
```bash
GET /roles
Authorization: Bearer <superadmin-token>
```

**3. Crear usuario admin**
```bash
POST /users
Authorization: Bearer <superadmin-token>
Content-Type: application/json

{
  "name": "Admin",
  "lastName": "Usuario",
  "email": "admin@milaraffo.com",
  "password": "Admin123!",
  "roleId": "<id-del-rol-admin-obtenido-en-paso-2>"
}
```

## ⚠️ Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| "Client role not found" | No se ejecutó el seed | `npm run seed` |
| "Access denied. Admin privileges required" | Intentando login admin con usuario CLIENT | Usar `/auth/login` para clientes |
| "Admins cannot modify other admins" | Admin intentando modificar otro admin | Solo SUPERADMIN puede hacer esto |
| "User not authenticated" | Token no enviado o inválido | Incluir `Authorization: Bearer <token>` |

## 🔄 Flujo Típico de Uso

```
1. Ejecutar seed → npm run seed
2. Login superadmin → POST /auth/admin/login
3. Usar token en headers → Authorization: Bearer <token>
4. Gestionar recursos → POST /products, GET /users, etc.
```

## 📖 Documentación Completa

Ver [ROLES_GUIDE.md](./ROLES_GUIDE.md) para documentación detallada.
