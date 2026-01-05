# Sistema de Roles - Guía de Implementación

## Resumen de Cambios

Se ha implementado un sistema completo de roles basado en base de datos con tres niveles de permisos:

### Roles Disponibles

1. **CLIENT** (client) - Usuario estándar
   - Acceso básico a la aplicación
   - Puede ver productos, categorías, etc.

2. **ADMIN** (admin) - Administrador
   - Gestión de productos, categorías, variantes, etc.
   - Gestión de usuarios tipo CLIENT
   - **NO** puede gestionar roles
   - **NO** puede crear, modificar o eliminar otros ADMIN o SUPERADMIN

3. **SUPERADMIN** (superadmin) - Super Administrador
   - Acceso total al sistema
   - Puede gestionar roles
   - Puede gestionar todos los usuarios (incluidos ADMIN y SUPERADMIN)

## Archivos Creados

### Entidades y Módulos
- `src/roles/entities/role.entity.ts` - Entidad Role
- `src/roles/roles.service.ts` - Servicio de roles
- `src/roles/roles.controller.ts` - Controlador de roles
- `src/roles/roles.module.ts` - Módulo de roles
- `src/roles/dto/create-role.dto.ts` - DTO para crear rol
- `src/roles/dto/update-role.dto.ts` - DTO para actualizar rol

### Guards y Decoradores
- `src/auth/guards/resource.guard.ts` - Guard para permisos granulares por recurso
- `src/auth/guards/admin-user-management.guard.ts` - Guard para gestión de usuarios por admins
- `src/common/decorators/resource-action.decorator.ts` - Decorador para acciones sobre recursos

### Seed
- `src/database/seeds/seed.ts` - Función de seed
- `scripts/seed.ts` - Script ejecutable para seed

## Archivos Modificados

### Entidad User
- Reemplazado el enum `role` por relación `ManyToOne` con `Role`
- Añadido campo `roleId` (UUID)
- Carga eager de la relación `role`

### Auth Service
- Actualizado para usar `roleId` en lugar de enum
- Método `register()` asigna automáticamente rol CLIENT
- Actualizado `buildPayload()` para usar `role.name`
- Mejorado `mapUserResponse()` para devolver información completa del rol

### Guards
- `RolesGuard` actualizado para:
  - Trabajar con `RoleName` enum
  - SUPERADMIN tiene acceso automático a todo
  - Verificar rol desde `user.role.name`

### Controladores
- `UsersController` protegido con guards JWT y Roles
- Validaciones para que ADMIN no modifique otros ADMIN/SUPERADMIN
- `RolesController` solo accesible por SUPERADMIN

## Configuración Inicial

### 1. Ejecutar el Seed

Antes de usar el sistema, debes ejecutar el seed para crear los roles y el usuario superadmin:

```bash
npm run seed
```

Esto creará:
- **3 roles**: client, admin, superadmin
- **1 usuario superadmin**:
  - Email: `superadmin@milaraffo.com`
  - Password: `SuperAdmin123!`

### 2. Login para Panel de Admin

Se ha creado un endpoint especial para el login del panel de admin:

**Endpoint**: `POST /auth/admin/login`

**Body**:
```json
{
  "email": "superadmin@milaraffo.com",
  "password": "SuperAdmin123!"
}
```

**Diferencias con `/auth/login`**:
- `/auth/login` - Login general, permite cualquier usuario (CLIENT, ADMIN, SUPERADMIN)
- `/auth/admin/login` - Solo permite ADMIN y SUPERADMIN, rechaza usuarios CLIENT

**Uso recomendado**:
- En tu panel de admin (frontend), usa `/auth/admin/login`
- En tu app cliente, usa `/auth/login`

### 3. Verificar el Token

El token JWT ahora incluye:
```json
{
  "sub": "uuid-del-usuario",
  "email": "usuario@ejemplo.com",
  "role": "admin" // o "client" o "superadmin"
}
```

## Permisos por Endpoint

### Roles (`/roles`)
- `GET /roles` - SUPERADMIN
- `GET /roles/:id` - SUPERADMIN
- `POST /roles` - SUPERADMIN
- `PATCH /roles/:id` - SUPERADMIN
- `DELETE /roles/:id` - SUPERADMIN

### Usuarios (`/users`)
- `GET /users` - ADMIN, SUPERADMIN
- `GET /users/:id` - ADMIN, SUPERADMIN
- `POST /users` - ADMIN, SUPERADMIN
- `PATCH /users/:id` - ADMIN (solo CLIENT), SUPERADMIN (todos)
- `DELETE /users/:id` - ADMIN (solo CLIENT), SUPERADMIN (todos)

### Auth (`/auth`)
- `POST /auth/register` - Público (crea usuarios CLIENT)
- `POST /auth/login` - Público (todos los roles)
- `POST /auth/admin/login` - Público (solo ADMIN y SUPERADMIN)
- `POST /auth/refresh` - Autenticado

### Otros Recursos (Products, Categories, etc.)
- `GET` - CLIENT, ADMIN, SUPERADMIN
- `POST` - ADMIN, SUPERADMIN
- `PATCH` - ADMIN, SUPERADMIN
- `DELETE` - ADMIN, SUPERADMIN

## Validaciones Implementadas

### ADMIN no puede:
1. ❌ Crear usuarios con `roleId` específico
2. ❌ Modificar el `roleId` de usuarios existentes
3. ❌ Actualizar usuarios ADMIN o SUPERADMIN
4. ❌ Eliminar usuarios ADMIN o SUPERADMIN
5. ❌ Acceder a endpoints de `/roles`

### SUPERADMIN puede:
1. ✅ Todo lo que puede ADMIN
2. ✅ Gestionar roles (CRUD completo)
3. ✅ Crear/modificar/eliminar usuarios ADMIN
4. ✅ Crear/modificar/eliminar usuarios SUPERADMIN
5. ✅ Asignar roles a usuarios

## Uso del ResourceGuard (Opcional)

Se ha creado un guard adicional `ResourceGuard` para permisos más granulares:

```typescript
@UseGuards(JwtAuthGuard, ResourceGuard)
@ResourceAction({ 
  resource: 'products', 
  action: 'create',
  allowedRoles: [RoleName.ADMIN, RoleName.SUPERADMIN]
})
@Post()
create(@Body() createProductDto: CreateProductDto) {
  // ...
}
```

## Migraciones

El sistema usa `synchronize: true` en desarrollo, por lo que las tablas se crearán automáticamente. En producción, deberás:

1. Crear migrations de TypeORM
2. Ejecutar las migrations
3. Ejecutar el seed

## Testing

Ejemplos de cómo probar el sistema:

### 1. Ejecutar Seed
```bash
npm run seed
```

### 2. Login como Superadmin
```bash
POST /auth/admin/login
{
  "email": "superadmin@milaraffo.com",
  "password": "SuperAdmin123!"
}
```

### 3. Crear un Admin
```bash
POST /users
Authorization: Bearer <token-superadmin>
{
  "name": "Admin",
  "lastName": "User",
  "email": "admin@milaraffo.com",
  "password": "Admin123!",
  "roleId": "<id-del-rol-admin>"
}
```

### 4. Intentar que Admin cree otro Admin (debe fallar)
```bash
POST /users
Authorization: Bearer <token-admin>
{
  "name": "Otro",
  "lastName": "Admin",
  "email": "otro@milaraffo.com",
  "password": "Password123!",
  "roleId": "<id-del-rol-admin>"
}
```
Resultado esperado: `403 Forbidden - Admins cannot assign roles`

## Próximos Pasos Sugeridos

1. **Actualizar Frontend**:
   - Usar `/auth/admin/login` para el panel de admin
   - Mostrar/ocultar opciones según el rol del usuario
   - Deshabilitar botones de gestión de usuarios para admins cuando el usuario objetivo es admin/superadmin

2. **Implementar Migrations**:
   - Cuando pases a producción, desactiva `synchronize`
   - Crea migrations con `npm run migration:generate`
   - Integra el seed en el proceso de deployment

3. **Mejorar Seguridad**:
   - Implementar rate limiting en endpoints sensibles
   - Añadir logs de auditoría para acciones de ADMIN/SUPERADMIN
   - Implementar 2FA para usuarios ADMIN/SUPERADMIN

4. **Tests**:
   - Crear tests e2e para verificar permisos
   - Tests unitarios para los guards
   - Tests de integración para el seed

## Troubleshooting

### Error: "Client role not found"
**Solución**: Ejecuta `npm run seed` para crear los roles

### Error: "User not authenticated" en endpoints protegidos
**Solución**: Asegúrate de incluir el header `Authorization: Bearer <token>`

### Error: "Admins cannot modify other admins"
**Solución**: Esto es esperado, usa una cuenta SUPERADMIN para gestionar admins

### Error al ejecutar seed
**Solución**: 
1. Verifica que la base de datos esté corriendo
2. Verifica las variables de entorno (.env)
3. Asegúrate de que las tablas existan (ejecuta la app primero en dev)
