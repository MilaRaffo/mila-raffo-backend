# Guía de E-commerce - Promociones, Cupones, Pedidos y Pagos

Esta guía explica cómo usar las nuevas funcionalidades de e-commerce implementadas en el backend.

## 📋 Tabla de Contenidos

1. [Sistema de Promociones](#sistema-de-promociones)
2. [Sistema de Cupones](#sistema-de-cupones)
3. [Gestión de Direcciones](#gestión-de-direcciones)
4. [Flujo de Pedidos](#flujo-de-pedidos)
5. [Procesamiento de Pagos](#procesamiento-de-pagos)
6. [Disponibilidad de Productos](#disponibilidad-de-productos)

---

## Sistema de Promociones

### Tipos de Promociones

1. **PERCENTAGE**: Descuento porcentual
2. **FIXED_AMOUNT**: Descuento de monto fijo
3. **BUY_X_GET_Y**: Compra X y lleva Y
4. **FREE_SHIPPING**: Envío gratis

### Crear Promoción

```bash
POST /api/v1/promotions
Authorization: Bearer <admin-token>

{
  "name": "Black Friday 2026",
  "description": "Descuento especial por Black Friday",
  "type": "percentage",
  "discountValue": 20,
  "minimumPurchase": 100,
  "maximumDiscount": 500,
  "startDate": "2026-11-25T00:00:00.000Z",
  "endDate": "2026-11-30T23:59:59.000Z",
  "status": "scheduled",
  "isStackable": false,
  "priority": 10,
  "productIds": ["uuid-1", "uuid-2"],
  "categoryIds": ["uuid-3"]
}
```

### Obtener Promociones Activas

```bash
GET /api/v1/promotions/active

# Responde con todas las promociones vigentes
```

### Estados de Promoción

- `scheduled`: Programada para el futuro
- `active`: Activa y vigente
- `inactive`: Inactiva
- `expired`: Expirada

---

## Sistema de Cupones

### Crear Cupón

```bash
POST /api/v1/coupons
Authorization: Bearer <admin-token>

{
  "code": "SUMMER2026",
  "name": "Summer Sale 2026",
  "description": "Get 20% off on all products",
  "type": "percentage",
  "value": 20,
  "minimumPurchase": 100,
  "maximumDiscount": 500,
  "usageLimit": 100,
  "usageLimitPerUser": 1,
  "validFrom": "2026-06-01T00:00:00.000Z",
  "validUntil": "2026-08-31T23:59:59.000Z",
  "status": "active",
  "isSingleUse": false
}
```

### Validar Cupón

```bash
POST /api/v1/coupons/validate?cartTotal=500
Authorization: Bearer <user-token>

{
  "code": "SUMMER2026"
}

# Respuesta:
{
  "valid": true,
  "coupon": { ... },
  "discount": 100,
  "message": "Coupon is valid"
}
```

### Cupón Personal (Restricto a Usuario)

```bash
POST /api/v1/coupons
{
  "code": "WELCOME-JOHN",
  "type": "fixed_amount",
  "value": 50,
  "restrictedToUserId": "user-uuid",
  "isSingleUse": true
}
```

---

## Gestión de Direcciones

### Crear Dirección

```bash
POST /api/v1/addresses
Authorization: Bearer <user-token>

{
  "firstName": "John",
  "lastName": "Doe",
  "streetAddress": "123 Main St",
  "apartment": "Apt 4B",
  "city": "New York",
  "stateProvince": "NY",
  "postalCode": "10001",
  "country": "United States",
  "phone": "+1234567890",
  "isDefault": true,
  "notes": "Ring the doorbell twice"
}
```

### Obtener Direcciones del Usuario

```bash
GET /api/v1/addresses
Authorization: Bearer <user-token>

# Responde con todas las direcciones, ordenadas por default primero
```

### Establecer Dirección por Defecto

```bash
PATCH /api/v1/addresses/{id}/set-default
Authorization: Bearer <user-token>
```

### Obtener Dirección por Defecto

```bash
GET /api/v1/addresses/default
Authorization: Bearer <user-token>
```

---

## Flujo de Pedidos

### 1. Crear Pedido

```bash
POST /api/v1/orders
Authorization: Bearer <user-token>

{
  "items": [
    {
      "variantId": "variant-uuid-1",
      "quantity": 2
    },
    {
      "variantId": "variant-uuid-2",
      "quantity": 1
    }
  ],
  "shippingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "streetAddress": "123 Main St",
    "city": "New York",
    "stateProvince": "NY",
    "postalCode": "10001",
    "country": "United States",
    "phone": "+1234567890"
  },
  "billingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "streetAddress": "123 Main St",
    "city": "New York",
    "stateProvince": "NY",
    "postalCode": "10001",
    "country": "United States"
  },
  "couponCode": "SUMMER2026",
  "notes": "Please deliver between 9-5"
}
```

**Respuesta:**

```json
{
  "id": "order-uuid",
  "orderNumber": "ORD-260130-0001",
  "status": "pending",
  "paymentStatus": "pending",
  "subtotal": 699.98,
  "discountAmount": 139.99,
  "shippingCost": 0,
  "taxAmount": 44.80,
  "total": 604.79,
  "items": [...]
}
```

### 2. Obtener Pedidos del Usuario

```bash
GET /api/v1/orders?page=1&limit=10
Authorization: Bearer <user-token>

# Usuarios ven solo sus pedidos
# Admins ven todos los pedidos
```

### 3. Obtener Pedido por Número

```bash
GET /api/v1/orders/number/ORD-260130-0001
Authorization: Bearer <user-token>
```

### 4. Cancelar Pedido

```bash
PATCH /api/v1/orders/{id}/cancel
Authorization: Bearer <user-token>

# Solo se pueden cancelar pedidos en estado 'pending' o 'confirmed'
```

### 5. Actualizar Estado (Admin)

```bash
PATCH /api/v1/orders/{id}
Authorization: Bearer <admin-token>

{
  "status": "shipped",
  "trackingNumber": "TRACK123456"
}
```

### Estados de Pedido

1. `pending` - Pendiente de pago
2. `confirmed` - Confirmado (pago exitoso)
3. `processing` - En proceso
4. `shipped` - Enviado
5. `delivered` - Entregado
6. `cancelled` - Cancelado
7. `refunded` - Reembolsado

---

## Procesamiento de Pagos

### 1. Crear Pago (Modo Test)

```bash
POST /api/v1/payments
Authorization: Bearer <user-token>

{
  "orderId": "order-uuid",
  "method": "test"
}
```

**Respuesta (pago exitoso - 95% de probabilidad):**

```json
{
  "id": "payment-uuid",
  "orderId": "order-uuid",
  "amount": 604.79,
  "method": "test",
  "status": "completed",
  "transactionId": "TEST-1706601234567-abc123def",
  "paymentGatewayResponse": "Test payment completed successfully",
  "processedAt": "2026-01-30T10:30:00.000Z"
}
```

### 2. Obtener Pagos del Usuario

```bash
GET /api/v1/payments
Authorization: Bearer <user-token>
```

### 3. Obtener Pagos de un Pedido

```bash
GET /api/v1/payments/order/{orderId}
Authorization: Bearer <user-token>
```

### 4. Reembolsar Pago (Admin)

```bash
PATCH /api/v1/payments/{id}/refund
Authorization: Bearer <admin-token>

# Solo pagos en estado 'completed' pueden ser reembolsados
```

### Métodos de Pago Soportados

- `test` - Modo de prueba (implementado)
- `credit_card` - Tarjeta de crédito (preparado)
- `debit_card` - Tarjeta de débito (preparado)
- `paypal` - PayPal (preparado)
- `stripe` - Stripe (preparado)
- `mercadopago` - MercadoPago (preparado)
- `bank_transfer` - Transferencia bancaria (preparado)

### Estados de Pago

1. `pending` - Pendiente
2. `processing` - Procesando
3. `completed` - Completado
4. `failed` - Fallido
5. `refunded` - Reembolsado
6. `cancelled` - Cancelado

### Integración con Pasarelas Reales

El sistema está preparado para integrar pasarelas reales. Para agregar una:

1. Implementar el método de procesamiento en `PaymentsService`
2. Configurar credenciales en variables de entorno
3. Configurar webhook en `POST /api/v1/payments/webhook/:provider`

---

## Disponibilidad de Productos

### Cambio de Stock a Disponibilidad

Los productos y variantes ahora usan un campo booleano `isAvailable` en lugar de stock numérico.

### Marcar Producto como No Disponible

```bash
PATCH /api/v1/products/{id}
Authorization: Bearer <admin-token>

{
  "available": false
}
```

### Marcar Variante como No Disponible

```bash
PATCH /api/v1/variants/{id}
Authorization: Bearer <admin-token>

{
  "isAvailable": false
}
```

### Validación en Pedidos

Al crear un pedido, el sistema valida:

1. ✅ Todas las variantes existen
2. ✅ Todas las variantes están disponibles (`isAvailable: true`)
3. ✅ Todos los productos están disponibles (`available: true`)

Si alguna validación falla, el pedido no se crea.

---

## Perfil de Usuario

### Obtener Perfil Completo

```bash
GET /api/v1/users/profile
Authorization: Bearer <user-token>

# Responde con:
# - Información del usuario
# - Rol completo
# - Todas las direcciones guardadas
```

---

## Flujo Completo de Compra

### Paso 1: Explorar Productos

```bash
GET /api/v1/products
GET /api/v1/products/{id}
GET /api/v1/products/{id}/variants
```

### Paso 2: Verificar Promociones

```bash
GET /api/v1/promotions/active
```

### Paso 3: Crear/Actualizar Dirección

```bash
POST /api/v1/addresses
# o usar dirección existente
GET /api/v1/addresses
```

### Paso 4: Validar Cupón (opcional)

```bash
POST /api/v1/coupons/validate?cartTotal=500
{
  "code": "SUMMER2026"
}
```

### Paso 5: Crear Pedido

```bash
POST /api/v1/orders
{
  "items": [...],
  "shippingAddress": {...},
  "billingAddress": {...},
  "couponCode": "SUMMER2026"
}
```

### Paso 6: Procesar Pago

```bash
POST /api/v1/payments
{
  "orderId": "order-uuid",
  "method": "test"
}
```

### Paso 7: Verificar Estado del Pedido

```bash
GET /api/v1/orders/{id}
GET /api/v1/orders/number/ORD-260130-0001
```

---

## Administración

### Panel de Administración

Los administradores tienen acceso a:

- ✅ Gestión de promociones
- ✅ Gestión de cupones
- ✅ Ver todos los pedidos
- ✅ Actualizar estado de pedidos
- ✅ Agregar números de tracking
- ✅ Procesar reembolsos
- ✅ Ver todos los pagos

### Superadministrador

Los superadministradores además pueden:

- ✅ Gestionar roles
- ✅ Gestionar usuarios admin
- ✅ Acceso completo al sistema

---

## Consideraciones de Seguridad

1. **Validación de Permisos**: Usuarios solo pueden ver/modificar sus propios pedidos, pagos y direcciones
2. **Validación de Disponibilidad**: Los pedidos validan disponibilidad de productos antes de crearse
3. **Validación de Cupones**: Sistema robusto de validación para prevenir fraudes
4. **Registro de Uso**: Todos los usos de cupones quedan registrados
5. **Soft Deletes**: Datos importantes nunca se borran físicamente

---

## Webhooks (Preparado para Futuro)

```bash
POST /api/v1/payments/webhook/stripe
POST /api/v1/payments/webhook/paypal
POST /api/v1/payments/webhook/mercadopago

# Estas rutas están listas para recibir callbacks de pasarelas de pago
```

---

**¡El sistema está listo para manejar un flujo completo de e-commerce!** 🎉
