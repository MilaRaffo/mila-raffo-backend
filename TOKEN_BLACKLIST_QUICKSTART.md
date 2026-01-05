# 🔐 Token Blacklist - Quick Start

## ✅ Sistema Implementado

Sistema completo de blacklist para invalidar tokens en:
- Logout de usuarios
- Cambio de contraseña
- Reset password
- Revocación manual

## 🚀 Instalación

### 1. Instalar Dependencia de Schedule

```bash
npm install @nestjs/schedule
```

### 2. Ejecutar Migraciones (si es necesario)

El sistema creará la tabla `token_blacklist` automáticamente con `synchronize: true`.

## 📡 Uso Básico

### Logout Simple

```bash
POST /auth/logout
Authorization: Bearer <access_token>
Content-Type: application/json

{}
```

### Logout con Refresh Token

```bash
POST /auth/logout
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

## 🔄 ¿Qué Hace el Sistema?

### Al Hacer Logout:
1. ✅ Extrae el access token del header `Authorization`
2. ✅ Agrega el access token a la blacklist
3. ✅ Si se proporciona refresh token, también lo agrega
4. ✅ Marca los tokens como invalidados por "logout"
5. ✅ Futuros requests con esos tokens son rechazados con error 401

### En Cada Request Autenticado:
1. 🔍 JWT Strategy verifica si el token está en la blacklist
2. ❌ Si está en blacklist → Error 401: "Token has been revoked"
3. ✅ Si NO está en blacklist → Continúa normalmente

### Limpieza Automática:
1. 🕒 Cron job ejecuta **todos los días a las 3:00 AM**
2. 🧹 Elimina tokens cuya fecha `expiresAt` ya pasó
3. 📊 Registra cuántos tokens fueron eliminados

## 📋 Tabla token_blacklist

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | ID único |
| `token` | TEXT | Token JWT completo |
| `tokenType` | ENUM | access, refresh, reset_password, email_verification |
| `userId` | UUID | ID del usuario |
| `reason` | ENUM | logout, password_changed, token_used, security_breach, manual_revocation |
| `expiresAt` | TIMESTAMP | Cuándo expira el token |
| `notes` | TEXT | Notas opcionales |
| `createdAt` | TIMESTAMP | Cuándo se agregó a blacklist |

## 🔐 Tipos de Token

```typescript
enum TokenType {
  ACCESS = 'access',              // Token de acceso
  REFRESH = 'refresh',            // Token de refresh
  RESET_PASSWORD = 'reset_password',  // Token de reset password
  EMAIL_VERIFICATION = 'email_verification', // Token de verificación
}
```

## 📝 Razones de Invalidación

```typescript
enum BlacklistReason {
  LOGOUT = 'logout',                    // Usuario hizo logout
  PASSWORD_CHANGED = 'password_changed', // Se cambió la contraseña
  TOKEN_USED = 'token_used',            // Token de un solo uso ya usado
  SECURITY_BREACH = 'security_breach',   // Brecha de seguridad
  MANUAL_REVOCATION = 'manual_revocation', // Revocación manual
}
```

## 💡 Ejemplos de Integración

### Frontend - Logout
```typescript
async function logout() {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  
  try {
    await fetch('/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });
  } finally {
    // Limpiar storage siempre
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  }
}
```

### Backend - Invalidar al Cambiar Contraseña
```typescript
async changePassword(userId: string, newPassword: string) {
  // Cambiar contraseña
  await this.usersService.updatePassword(userId, newPassword);
  
  // Invalidar TODOS los tokens del usuario
  await this.authService.invalidateUserTokens(
    userId,
    BlacklistReason.PASSWORD_CHANGED
  );
  
  return { message: 'Password changed. Please login again.' };
}
```

## 🧪 Testing

### Test Manual

1. **Login:**
```bash
POST /auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

Guardar el `accessToken` de la respuesta.

2. **Verificar que funciona:**
```bash
GET /users/me
Authorization: Bearer <accessToken>
```
Debe retornar el usuario.

3. **Logout:**
```bash
POST /auth/logout
Authorization: Bearer <accessToken>
```

4. **Verificar que ya NO funciona:**
```bash
GET /users/me
Authorization: Bearer <accessToken>
```
Debe retornar error 401: "Token has been revoked"

## ⚙️ Configuración del Cron

Por defecto limpia a las 3:00 AM. Para cambiar:

```typescript
// En token-cleanup.service.ts
@Cron(CronExpression.EVERY_DAY_AT_3AM)  // Cambiar aquí
async handleCleanup() {
  // ...
}
```

Opciones comunes:
- `CronExpression.EVERY_DAY_AT_MIDNIGHT` - 00:00
- `CronExpression.EVERY_DAY_AT_NOON` - 12:00
- `CronExpression.EVERY_HOUR` - Cada hora
- `'0 */6 * * *'` - Cada 6 horas

## 📊 Monitoreo

### Ver Estadísticas (Opcional)

Puedes agregar un endpoint admin:

```typescript
@Get('admin/blacklist/stats')
@Roles(RoleName.SUPERADMIN)
async getBlacklistStats() {
  return await this.tokenBlacklistService.getBlacklistStats();
}
```

## 🎯 Archivos Creados

### Entidades
- ✅ `src/auth/entities/token-blacklist.entity.ts`

### Servicios
- ✅ `src/auth/services/token-blacklist.service.ts`
- ✅ `src/auth/services/token-cleanup.service.ts`

### DTOs
- ✅ `src/auth/dto/logout.dto.ts`

### Actualizados
- ✅ `src/auth/auth.service.ts` - Métodos logout e invalidateUserTokens
- ✅ `src/auth/auth.controller.ts` - Endpoint POST /auth/logout
- ✅ `src/auth/auth.module.ts` - Importa TokenBlacklist y servicios
- ✅ `src/auth/strategies/jwt.strategy.ts` - Verifica blacklist
- ✅ `src/app.module.ts` - Importa ScheduleModule

## ⚠️ Notas Importantes

1. **Primera Vez**: La tabla se crea automáticamente en desarrollo
2. **Producción**: Crear migration antes de deployar
3. **Performance**: Cada request hace 1 query adicional a `token_blacklist`
4. **Limpieza**: Los tokens se eliminan solo DESPUÉS de expirar

## 📖 Documentación Completa

Ver [TOKEN_BLACKLIST_GUIDE.md](./TOKEN_BLACKLIST_GUIDE.md) para:
- Ejemplos avanzados
- Casos de uso completos
- Mejores prácticas
- Troubleshooting

## 🚀 Siguiente Paso

```bash
# Instalar dependencias
npm install @nestjs/schedule

# Ejecutar la app
npm run start:dev

# Probar logout
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```
