# Token Blacklist System - Guía de Uso

## 📋 Resumen

Sistema completo de blacklist para gestionar tokens invalidados en eventos como:
- ✅ Logout de usuarios
- ✅ Cambio de contraseña
- ✅ Reset password tokens usados
- ✅ Revocación manual de tokens
- ✅ Brechas de seguridad

## 🏗️ Arquitectura

### Entidad TokenBlacklist
Almacena tokens invalidados con:
- `token`: El token JWT completo
- `tokenType`: Tipo (access, refresh, reset_password, email_verification)
- `userId`: ID del usuario dueño del token
- `reason`: Razón de invalidación (logout, password_changed, token_used, etc.)
- `expiresAt`: Fecha de expiración del token
- `notes`: Notas adicionales opcionales

### Servicios

#### **TokenBlacklistService**
Gestiona la blacklist:
- `addToBlacklist()` - Agrega un token a la blacklist
- `isBlacklisted()` - Verifica si un token está invalidado
- `cleanupExpiredTokens()` - Limpia tokens expirados
- `getUserBlacklistedTokens()` - Obtiene tokens invalidados de un usuario
- `getBlacklistStats()` - Estadísticas de la blacklist

#### **TokenCleanupService**
Servicio de limpieza automática:
- Cron job que ejecuta a las 3:00 AM todos los días
- Elimina tokens expirados de la base de datos
- Reduce el tamaño de la tabla automáticamente

## 🔐 Integración con JWT

### JWT Strategy
Actualizado para verificar blacklist:
```typescript
async validate(req: Request, payload: JwtPayload): Promise<User> {
  const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
  
  // Verificar si el token está en la blacklist
  const isBlacklisted = await this.tokenBlacklistService.isBlacklisted(token);
  if (isBlacklisted) {
    throw new UnauthorizedException('Token has been revoked');
  }
  
  // Continuar con validación normal...
}
```

## 📡 Endpoints

### POST /auth/logout
Invalida tokens del usuario.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Body (opcional):**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Respuesta:**
```json
{
  "message": "Logout successful"
}
```

**Comportamiento:**
1. Invalida el access token automáticamente
2. Si se proporciona `refreshToken`, también lo invalida
3. Tokens agregados a la blacklist con razón "logout"

## 🔄 Flujo de Logout

```
1. Usuario hace logout desde la aplicación
   ↓
2. Frontend envía POST /auth/logout con:
   - Access token en header Authorization
   - (Opcional) Refresh token en body
   ↓
3. Backend agrega tokens a blacklist
   ↓
4. Tokens quedan invalidados
   ↓
5. Futuros requests con esos tokens son rechazados
   ↓
6. Token se elimina automáticamente después de expirar (3 AM cron)
```

## 💻 Ejemplos de Uso

### 1. Logout Simple
```bash
POST /auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{}
```

### 2. Logout con Refresh Token
```bash
POST /auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Invalidar Tokens al Cambiar Contraseña
```typescript
// En el servicio de cambio de contraseña
async changePassword(userId: string, newPassword: string) {
  // Cambiar la contraseña
  await this.usersService.updatePassword(userId, newPassword);
  
  // Invalidar todos los tokens del usuario
  await this.authService.invalidateUserTokens(
    userId,
    BlacklistReason.PASSWORD_CHANGED
  );
}
```

## 🛠️ Instalación de Dependencias

El sistema requiere `@nestjs/schedule` para los cron jobs:

```bash
npm install @nestjs/schedule
```

Este paquete ya está incluido si usas una versión reciente de NestJS.

## ⚙️ Configuración

### 1. Asegurar ScheduleModule en AppModule

Ya está configurado en `app.module.ts`:
```typescript
@Module({
  imports: [
    ScheduleModule.forRoot(), // ✅ Ya agregado
    // ... otros imports
  ],
})
```

### 2. Verificar Database Config

La entidad `TokenBlacklist` se creará automáticamente si `synchronize: true` está activo en desarrollo.

## 🧹 Limpieza Automática

### Cron Job (Automático)
El sistema limpia tokens expirados automáticamente:
- **Frecuencia**: Todos los días a las 3:00 AM
- **Acción**: Elimina tokens donde `expiresAt < NOW()`
- **Log**: Registra cuántos tokens fueron eliminados

### Limpieza Manual (Opcional)
Para ejecutar limpieza manualmente:

```typescript
// En un controlador admin o script
@Post('admin/cleanup-tokens')
@Roles(RoleName.SUPERADMIN)
async cleanupTokens() {
  const count = await this.tokenCleanupService.manualCleanup();
  return { message: `${count} tokens cleaned up` };
}
```

## 📊 Estadísticas

Obtener estadísticas de la blacklist:

```typescript
const stats = await tokenBlacklistService.getBlacklistStats();

// Resultado:
{
  total: 150,
  byType: {
    access: 80,
    refresh: 70
  },
  byReason: {
    logout: 120,
    password_changed: 30
  },
  expired: 45
}
```

## 🔒 Consideraciones de Seguridad

### 1. Tokens de Reset Password
Al usar un token de reset password, agrégalo a la blacklist:

```typescript
async resetPassword(token: string, newPassword: string) {
  // Validar y usar el token
  const user = await this.validateResetToken(token);
  
  // Cambiar contraseña
  await this.usersService.updatePassword(user.id, newPassword);
  
  // Invalidar el token de reset
  await this.tokenBlacklistService.addToBlacklist(
    token,
    TokenType.RESET_PASSWORD,
    user.id,
    BlacklistReason.TOKEN_USED,
    'Password reset token used'
  );
}
```

### 2. Brecha de Seguridad
Invalidar todos los tokens de un usuario:

```typescript
await this.authService.invalidateUserTokens(
  userId,
  BlacklistReason.SECURITY_BREACH
);
```

### 3. Rendimiento

**Índices Creados:**
- `token` (unique) - Búsqueda rápida de tokens
- `userId` - Búsquedas por usuario
- `expiresAt` - Limpieza eficiente

**Recomendaciones:**
- La limpieza automática mantiene la tabla pequeña
- Los tokens se eliminan automáticamente al expirar
- No es necesario almacenar tokens indefinidamente

## 🧪 Testing

### Test de Logout
```typescript
describe('Logout', () => {
  it('should invalidate access token', async () => {
    const { accessToken } = await authService.login(credentials);
    
    // Logout
    await authService.logout(accessToken);
    
    // Verificar que el token está en blacklist
    const isBlacklisted = await tokenBlacklistService.isBlacklisted(accessToken);
    expect(isBlacklisted).toBe(true);
  });
});
```

### Test de JWT Strategy
```typescript
it('should reject blacklisted token', async () => {
  const { accessToken } = await authService.login(credentials);
  await authService.logout(accessToken);
  
  // Intentar usar el token
  await expect(
    request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
  ).rejects.toThrow('Token has been revoked');
});
```

## 📝 Mejores Prácticas

### Frontend

1. **Almacenar Refresh Token**
   ```typescript
   localStorage.setItem('refreshToken', response.refreshToken);
   ```

2. **Enviar en Logout**
   ```typescript
   const refreshToken = localStorage.getItem('refreshToken');
   await api.post('/auth/logout', { refreshToken });
   localStorage.clear();
   ```

3. **Limpiar Storage**
   ```typescript
   // Después del logout exitoso
   localStorage.removeItem('accessToken');
   localStorage.removeItem('refreshToken');
   ```

### Backend

1. **Usar en Cambio de Contraseña**
   ```typescript
   // Siempre invalidar tokens al cambiar contraseña
   await this.authService.invalidateUserTokens(
     userId,
     BlacklistReason.PASSWORD_CHANGED
   );
   ```

2. **Tokens de Un Solo Uso**
   ```typescript
   // Para reset password, email verification, etc.
   await this.tokenBlacklistService.addToBlacklist(
     token,
     TokenType.RESET_PASSWORD,
     userId,
     BlacklistReason.TOKEN_USED
   );
   ```

## 🎯 Casos de Uso Completos

### Cambio de Contraseña
```typescript
async changePassword(userId: UUID, oldPassword: string, newPassword: string) {
  // Validar contraseña actual
  const user = await this.usersService.findOne(userId);
  const isValid = await bcrypt.compare(oldPassword, user.password);
  
  if (!isValid) {
    throw new UnauthorizedException('Invalid current password');
  }
  
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

### Reset Password
```typescript
async resetPassword(token: string, newPassword: string) {
  // Decodificar y validar token
  const payload = await this.jwtService.verifyAsync(token);
  
  // Verificar que no esté en blacklist
  const isBlacklisted = await this.tokenBlacklistService.isBlacklisted(token);
  if (isBlacklisted) {
    throw new UnauthorizedException('Token already used');
  }
  
  // Cambiar contraseña
  await this.usersService.updatePassword(payload.userId, newPassword);
  
  // Marcar token como usado
  await this.tokenBlacklistService.addToBlacklist(
    token,
    TokenType.RESET_PASSWORD,
    payload.userId,
    BlacklistReason.TOKEN_USED,
    'Password reset completed'
  );
  
  return { message: 'Password reset successful' };
}
```

## ⚠️ Limitaciones y Consideraciones

1. **Almacenamiento**: Cada token ocupa espacio en BD hasta que expira
2. **Rendimiento**: Cada request hace una query adicional a la blacklist
3. **Escalabilidad**: Para alto tráfico, considera usar Redis como cache

## 🚀 Próximos Pasos Sugeridos

1. **Cache con Redis**
   - Usar Redis para verificación de blacklist más rápida
   - Reducir carga en la base de datos

2. **Panel de Admin**
   - Ver tokens invalidados
   - Estadísticas en tiempo real
   - Revocación manual de tokens

3. **Notificaciones**
   - Enviar email cuando se invalidan todos los tokens
   - Alertas de seguridad

4. **Logs de Auditoría**
   - Registrar todas las invalidaciones
   - Tracking de actividad sospechosa
