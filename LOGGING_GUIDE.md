# Sistema de Logging - Mila Raffo Store

## Descripción General

El sistema de logging de Mila Raffo Store utiliza **Winston** como motor principal de logs, proporcionando un sistema robusto y profesional para el registro de eventos, errores, acciones de negocio y auditoría de seguridad.

## Características Principales

### 📊 Múltiples Niveles de Log
- **error**: Errores críticos que requieren atención inmediata
- **warn**: Advertencias que no detienen la aplicación
- **info**: Información general de operaciones
- **http**: Logs de todas las peticiones HTTP
- **debug**: Información detallada para debugging

### 📁 Archivos de Log Separados
Los logs se almacenan en el directorio `logs/` con rotación diaria:

1. **combined-YYYY-MM-DD.log**: Todos los logs (nivel info y superior)
   - Retención: 14 días
   - Tamaño máximo: 20 MB por archivo

2. **error-YYYY-MM-DD.log**: Solo errores
   - Retención: 30 días
   - Tamaño máximo: 20 MB por archivo

3. **http-YYYY-MM-DD.log**: Peticiones HTTP
   - Retención: 7 días
   - Tamaño máximo: 20 MB por archivo

4. **security-YYYY-MM-DD.log**: Eventos de seguridad
   - Retención: 90 días (compliance)
   - Tamaño máximo: 20 MB por archivo

5. **business-YYYY-MM-DD.log**: Eventos de negocio
   - Retención: 90 días
   - Tamaño máximo: 20 MB por archivo

### 🔄 Rotación Automática
- Los archivos rotan diariamente
- Se comprimen automáticamente los archivos antiguos
- Limpieza automática según política de retención

## Categorías de Logs

### 1. HTTP Logs
Registra todas las peticiones HTTP con:
- Método (GET, POST, PUT, DELETE, etc.)
- Endpoint
- Código de estado HTTP
- Duración de la petición
- IP del cliente
- User Agent
- Usuario autenticado (si aplica)
- Success/failure

**Ejemplo:**
```json
{
  "timestamp": "2024-01-15 10:30:45",
  "level": "http",
  "message": "Completed GET /api/v1/products",
  "context": "HTTP",
  "category": "http",
  "method": "GET",
  "endpoint": "/api/v1/products",
  "statusCode": 200,
  "duration": 45,
  "ip": "192.168.1.100",
  "userId": "uuid-user-123",
  "userEmail": "user@example.com",
  "success": true
}
```

### 2. Security Logs
Eventos de seguridad críticos:
- Registro de usuarios
- Inicios de sesión exitosos/fallidos
- Cierres de sesión
- Accesos denegados
- Tokens inválidos
- Intentos de acceso no autorizado

**Ejemplo:**
```json
{
  "timestamp": "2024-01-15 10:31:22",
  "level": "info",
  "message": "[SECURITY] User Login",
  "context": "AuthService",
  "category": "security",
  "action": "User Login",
  "userId": "uuid-user-123",
  "email": "user@example.com",
  "ip": "192.168.1.100",
  "resource": "user"
}
```

### 3. Business Logs
Eventos importantes del negocio:
- Creación de órdenes
- Procesamiento de pagos
- Uso de cupones
- Cambios de estado de órdenes
- Reembolsos

**Ejemplo:**
```json
{
  "timestamp": "2024-01-15 10:32:10",
  "level": "info",
  "message": "[BUSINESS] Order Created",
  "context": "OrdersService",
  "category": "business",
  "action": "Order Created",
  "resourceId": "uuid-order-456",
  "userId": "uuid-user-123",
  "total": 150.50,
  "resource": "order"
}
```

### 4. Error Logs
Errores de la aplicación con stack traces completos:
```json
{
  "timestamp": "2024-01-15 10:33:00",
  "level": "error",
  "message": "Failed to process payment",
  "context": "PaymentsService",
  "trace": "Error: Payment gateway timeout\n    at PaymentsService.process...",
  "error": {
    "message": "Payment gateway timeout",
    "name": "GatewayError",
    "stack": "..."
  },
  "paymentId": "uuid-payment-789",
  "orderId": "uuid-order-456"
}
```

## Uso del Logger Service

### Inyección en Servicios

```typescript
import { LoggerService } from '../common/services/logger.service';

@Injectable()
export class MyService {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('MyService');
  }

  async myMethod() {
    // Log general
    this.logger.log('Operation started', { operation: 'myMethod' });

    // Log de error
    try {
      // ... código
    } catch (error) {
      this.logger.error('Operation failed', error.stack, {
        operation: 'myMethod',
        error: error.message,
      });
    }

    // Log de advertencia
    this.logger.warn('Low stock detected', { productId: '123', stock: 5 });
  }
}
```

### Métodos Disponibles

#### Métodos Básicos
```typescript
// Información general
logger.log(message: string, metadata?: object)

// Errores
logger.error(message: string, trace?: string, metadata?: object)

// Advertencias
logger.warn(message: string, metadata?: object)

// Debug
logger.debug(message: string, metadata?: object)

// HTTP
logger.http(message: string, metadata?: object)
```

#### Métodos de Seguridad
```typescript
// Registro de usuario
logger.userRegistered(userId: string, email: string)

// Login
logger.userLogin(userId: string, email: string, ip?: string)

// Logout
logger.userLogout(userId: string, email: string)

// Acceso denegado
logger.accessDenied(userId: string, resource: string, action: string, ip?: string)

// Token inválido
logger.invalidToken(token: string, reason: string, ip?: string)

// Evento de seguridad genérico
logger.security(action: string, metadata?: object)
```

#### Métodos de Negocio
```typescript
// Orden creada
logger.orderCreated(orderId: string, userId: string, total: number)

// Pago procesado
logger.paymentProcessed(paymentId: string, orderId: string, amount: number, status: string)

// Cupón usado
logger.couponUsed(couponCode: string, userId: string, discount: number)

// Evento de negocio genérico
logger.business(action: string, metadata?: object)
```

## Interceptores

### HTTP Logging Interceptor
Se aplica automáticamente a todas las peticiones HTTP.

### Business Log Interceptor
Se activa mediante el decorador `@LogAction()`:

```typescript
import { LogAction } from '../common/decorators/log-action.decorator';

@Controller('products')
export class ProductsController {
  @Post()
  @LogAction({
    action: 'Create Product',
    resource: 'product',
    includeResult: true,
    includeParams: false,
  })
  async create(@Body() dto: CreateProductDto) {
    // Se registrará automáticamente la creación del producto
    return this.productsService.create(dto);
  }
}
```

## Formato de Logs

### En Consola (Desarrollo)
```
2024-01-15 10:30:45 info [HTTP] Incoming GET /api/v1/products
2024-01-15 10:30:45 info [HTTP] Completed GET /api/v1/products {"statusCode":200,"duration":45}
```

### En Archivos (JSON)
```json
{
  "timestamp": "2024-01-15 10:30:45",
  "level": "info",
  "message": "Completed GET /api/v1/products",
  "context": "HTTP",
  "metadata": {
    "category": "http",
    "method": "GET",
    "endpoint": "/api/v1/products",
    "statusCode": 200,
    "duration": 45,
    "success": true
  }
}
```

## Buenas Prácticas

### 1. Contexto Siempre
```typescript
constructor(private readonly logger: LoggerService) {
  this.logger.setContext('ServiceName');
}
```

### 2. Metadata Relevante
```typescript
this.logger.log('Product created', {
  productId: product.id,
  name: product.name,
  price: product.price,
  category: product.category,
});
```

### 3. No Loguear Información Sensible
❌ **NUNCA:**
```typescript
this.logger.log('User logged in', {
  password: user.password,  // ❌ NUNCA
  cardNumber: payment.cardNumber,  // ❌ NUNCA
  cvv: payment.cvv,  // ❌ NUNCA
});
```

✅ **CORRECTO:**
```typescript
this.logger.log('User logged in', {
  userId: user.id,
  email: user.email,
  ip: request.ip,
});
```

### 4. Niveles Apropiados
- `error`: Solo para errores reales
- `warn`: Situaciones anómalas pero manejables
- `info`: Flujo normal de la aplicación
- `debug`: Información detallada para desarrollo

### 5. Stack Traces en Errores
```typescript
try {
  await this.riskyOperation();
} catch (error) {
  this.logger.error(
    'Operation failed',
    error.stack,  // ✅ Incluir stack trace
    { operation: 'riskyOperation' }
  );
  throw error;
}
```

## Monitoreo y Análisis

### Buscar en Logs
```bash
# Buscar errores del día
cat logs/error-2024-01-15.log | jq .

# Buscar por usuario específico
cat logs/combined-2024-01-15.log | jq 'select(.userId == "uuid-123")'

# Buscar peticiones lentas (>1000ms)
cat logs/http-2024-01-15.log | jq 'select(.duration > 1000)'

# Contar errores por contexto
cat logs/error-2024-01-15.log | jq -r .context | sort | uniq -c
```

### Estadísticas Útiles
```bash
# Peticiones por endpoint
cat logs/http-*.log | jq -r .endpoint | sort | uniq -c | sort -nr

# Usuarios más activos
cat logs/business-*.log | jq -r .userId | sort | uniq -c | sort -nr

# Eventos de seguridad
cat logs/security-*.log | jq -r .action | sort | uniq -c
```

## Integración con Herramientas Externas

### ELK Stack (Elasticsearch, Logstash, Kibana)
Los logs en formato JSON son perfectos para indexar en Elasticsearch:

```bash
# Enviar logs a Logstash
cat logs/*.log | nc logstash.example.com 5000
```

### CloudWatch (AWS)
```typescript
// Configurar transport de CloudWatch
const cloudwatchTransport = new WinstonCloudWatch({
  logGroupName: '/mila-raffo/api',
  logStreamName: `${process.env.NODE_ENV}`,
  awsRegion: 'us-east-1',
});
```

### Datadog
```typescript
// Configurar transport de Datadog
const datadogTransport = new DatadogWinston({
  apiKey: process.env.DATADOG_API_KEY,
  service: 'mila-raffo-api',
  ddsource: 'nodejs',
});
```

## Troubleshooting

### Los logs no se están generando
1. Verificar que el directorio `logs/` existe
2. Verificar permisos de escritura
3. Revisar configuración de Winston en `logger.service.ts`

### Archivos de log muy grandes
1. Ajustar `maxSize` en la configuración de transports
2. Reducir el período de retención
3. Implementar compresión

### Rendimiento degradado
1. Usar nivel `info` en producción (evitar `debug`)
2. Limitar metadata en logs de alto volumen
3. Considerar logging asíncrono

## Seguridad y Compliance

### Retención según GDPR
- Logs de seguridad: 90 días
- Logs de negocio: 90 días
- Logs de error: 30 días
- Logs HTTP: 7 días

### Protección de Datos
- No se almacenan contraseñas
- Tokens se truncan en logs
- Datos de pago se ofuscan
- PII se minimiza

### Auditoría
Todos los eventos de seguridad se registran:
- Login/logout
- Accesos denegados
- Cambios de permisos
- Operaciones administrativas

## Configuración Avanzada

### Variables de Entorno
```env
# Nivel de log (production)
LOG_LEVEL=info

# Directorio de logs
LOG_DIR=./logs

# Retención (días)
LOG_RETENTION_DAYS=14
LOG_RETENTION_ERROR_DAYS=30
LOG_RETENTION_SECURITY_DAYS=90

# Tamaño máximo por archivo
LOG_MAX_SIZE=20m
```

### Personalización
Editar `src/common/services/logger.service.ts` para:
- Agregar nuevos transports
- Modificar formatos
- Ajustar períodos de retención
- Implementar filtros personalizados

## Resumen

El sistema de logging proporciona:
- ✅ Registro completo de todas las operaciones
- ✅ Separación por categorías (HTTP, Security, Business, Error)
- ✅ Rotación automática de archivos
- ✅ Formato JSON para análisis
- ✅ Integración fácil con herramientas externas
- ✅ Cumplimiento de normativas
- ✅ Debugging eficiente
- ✅ Auditoría completa

Este sistema permite monitorear la salud de la aplicación, detectar problemas rápidamente, y mantener un registro completo de auditoría para compliance y análisis de negocio.
