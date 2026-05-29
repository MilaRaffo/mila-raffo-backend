# 06 — Endpoints

Prefijo global: `api/v1`

---

## Auth — `/auth`

| Metodo | Ruta | Guard | Descripcion |
|---|---|---|---|
| `POST` | `/auth/register` | Publico | Registrar nuevo cliente |
| `POST` | `/auth/login` | Publico | Login de cliente |
| `POST` | `/auth/admin/login` | Publico | Login exclusivo para admin/superadmin |
| `POST` | `/auth/logout` | JWT | Invalidar tokens activos |
| `POST` | `/auth/refresh` | Publico | Renovar tokens con refresh token |

**`POST /auth/register`**
```json
// Body
{ "name": "", "lastName": "", "email": "", "password": "", "phone": "" }
// Respuesta
{ "user": {...}, "accessToken": "...", "refreshToken": "..." }
```
Password: minimo 8 caracteres, debe tener mayuscula, minuscula, numero y caracter especial.

**`POST /auth/logout`**
```json
// Body
{ "accessToken": "...", "refreshToken": "..." }
```

**`POST /auth/refresh`**
```json
// Body
{ "refreshToken": "..." }
// Respuesta
{ "accessToken": "...", "refreshToken": "..." }
```

---

## Users — `/users`

Todos los endpoints requieren `JWT + ADMIN o SUPERADMIN`.

| Metodo | Ruta | Descripcion |
|---|---|---|
| `POST` | `/users` | Crear usuario |
| `GET` | `/users` | Listar (paginado, filtros: email, role, isActive) |
| `GET` | `/users/:id` | Detalle |
| `PATCH` | `/users/:id` | Actualizar |
| `DELETE` | `/users/:id` | Eliminar (soft delete) |

Reglas: admin no puede modificar/eliminar a otros admin o superadmin.

---

## Roles — `/roles`

Todos requieren `JWT + SUPERADMIN`.

| Metodo | Ruta | Descripcion |
|---|---|---|
| `POST` | `/roles` | Crear rol |
| `GET` | `/roles` | Listar |
| `GET` | `/roles/:id` | Detalle |
| `PATCH` | `/roles/:id` | Actualizar |
| `DELETE` | `/roles/:id` | Eliminar |

---

## Products — `/products`

| Metodo | Ruta | Guard | Descripcion |
|---|---|---|---|
| `POST` | `/products` | JWT + ADMIN | Crear producto |
| `GET` | `/products` | Publico | Listar (filtros: q, name, categoryId, available, minBasePrice, maxBasePrice) |
| `GET` | `/products/catalog/with-variants` | Publico | Vista catalogo con variantes e imagenes |
| `GET` | `/products/:id` | Publico | Detalle completo |
| `GET` | `/products/:id/variants` | Publico | Variantes del producto |
| `GET` | `/products/:id/characteristics` | Publico | Caracteristicas del producto |
| `PATCH` | `/products/:id` | JWT + ADMIN | Actualizar |
| `DELETE` | `/products/:id` | JWT + ADMIN | Eliminar (soft delete) |

**`POST /products`**
```json
{
  "name": "Cartera Aurora",
  "description": "...",
  "base_price": 289.99,
  "available": true,
  "is_customizable": false,
  "categoryIds": ["uuid1", "uuid2"],
  "characteristics": [
    { "characteristicId": "uuid", "value": "30" }
  ]
}
```

---

## Variants — `/variants`

| Metodo | Ruta | Guard | Descripcion |
|---|---|---|---|
| `POST` | `/variants` | JWT + ADMIN | Crear variante |
| `GET` | `/variants` | Publico | Listar |
| `GET` | `/variants/:id` | Publico | Detalle |
| `PATCH` | `/variants/:id` | JWT + ADMIN | Actualizar (precio, stock, disponibilidad) |
| `DELETE` | `/variants/:id` | JWT + ADMIN | Eliminar |

**`POST /variants`**
```json
{
  "productId": "uuid",
  "colorId": "uuid",
  "sku": "AURORA-NEGRO",
  "price": 289.99,
  "stock": 5,
  "isAvailable": true
}
```

---

## Categories — `/categories`

| Metodo | Ruta | Guard | Descripcion |
|---|---|---|---|
| `POST` | `/categories` | JWT + ADMIN | Crear categoria |
| `GET` | `/categories` | Publico | Listar |
| `GET` | `/categories/tree` | Publico | Arbol jerarquico |
| `GET` | `/categories/:id` | Publico | Detalle |
| `GET` | `/categories/:id/products` | Publico | Productos de la categoria |
| `PATCH` | `/categories/:id` | JWT + ADMIN | Actualizar |
| `DELETE` | `/categories/:id` | JWT + ADMIN | Eliminar |

---

## Colors — `/colors`

| Metodo | Ruta | Guard | Descripcion |
|---|---|---|---|
| `POST` | `/colors` | JWT + ADMIN | Crear color |
| `GET` | `/colors` | Publico | Listar |
| `GET` | `/colors/:id` | Publico | Detalle |
| `PATCH` | `/colors/:id` | JWT + ADMIN | Actualizar |
| `DELETE` | `/colors/:id` | JWT + ADMIN | Eliminar |

---

## Characteristics — `/characteristics`

| Metodo | Ruta | Guard | Descripcion |
|---|---|---|---|
| `POST` | `/characteristics` | JWT + ADMIN | Crear |
| `GET` | `/characteristics` | Publico | Listar |
| `GET` | `/characteristics/:id` | Publico | Detalle |
| `PATCH` | `/characteristics/:id` | JWT + ADMIN | Actualizar |
| `DELETE` | `/characteristics/:id` | JWT + ADMIN | Eliminar |

---

## Images — `/images`

| Metodo | Ruta | Guard | Descripcion |
|---|---|---|---|
| `POST` | `/images` | JWT + ADMIN | Crear con URL manual |
| `POST` | `/images/upload` | JWT + ADMIN | Subir archivo a S3 (multipart) |
| `GET` | `/images` | Publico | Listar |
| `GET` | `/images/variant/:variantId` | Publico | Imagenes de una variante |
| `GET` | `/images/:id` | Publico | Detalle |
| `PATCH` | `/images/:id` | JWT + ADMIN | Actualizar |
| `DELETE` | `/images/:id` | JWT + ADMIN | Eliminar |

`POST /images/upload` recibe multipart: campo `file` (imagen) + `variantId` (opcional) + `alt` (opcional).

---

## Cart — `/cart`

Todos requieren `JWT`.

| Metodo | Ruta | Descripcion |
|---|---|---|
| `POST` | `/cart/items` | Agregar item |
| `GET` | `/cart` | Ver carrito completo |
| `PATCH` | `/cart/items/:id` | Actualizar cantidad |
| `DELETE` | `/cart/items/:id` | Eliminar item |
| `DELETE` | `/cart` | Vaciar carrito |

**`POST /cart/items`**
```json
{ "variantId": "uuid", "quantity": 2 }
```
Valida stock: `quantity <= variant.stock`.

---

## Wishlist — `/wishlist`

Todos requieren `JWT`.

| Metodo | Ruta | Descripcion |
|---|---|---|
| `POST` | `/wishlist/items` | Agregar a lista de deseos |
| `GET` | `/wishlist` | Ver lista completa |
| `DELETE` | `/wishlist/items/:id` | Eliminar item |

---

## Orders — `/orders`

Todos requieren `JWT`.

| Metodo | Ruta | Descripcion |
|---|---|---|
| `POST` | `/orders` | Crear orden |
| `GET` | `/orders` | Listar ordenes del usuario autenticado |
| `GET` | `/orders/number/:orderNumber` | Buscar por numero de orden |
| `GET` | `/orders/:id` | Detalle |
| `PATCH` | `/orders/:id` | Actualizar (admin: status, tracking) |
| `PATCH` | `/orders/:id/cancel` | Cancelar orden |

**`POST /orders`**
```json
{
  "items": [
    { "variantId": "uuid", "quantity": 1, "customization": "Texto opcional" }
  ],
  "shippingAddress": {
    "firstName": "", "lastName": "", "streetAddress": "",
    "apartment": "", "city": "", "stateProvince": "",
    "postalCode": "", "country": "", "phone": ""
  },
  "billingAddress": { "..." },
  "couponCode": "DESCUENTO10",
  "notes": "Nota opcional"
}
```

---

## Payments — `/payments`

Todos requieren `JWT`.

| Metodo | Ruta | Guard adicional | Descripcion |
|---|---|---|---|
| `POST` | `/payments` | — | Crear pago |
| `GET` | `/payments` | — | Listar pagos del usuario |
| `GET` | `/payments/order/:orderId` | — | Pagos de una orden |
| `GET` | `/payments/:id` | — | Detalle |
| `PATCH` | `/payments/:id/refund` | ADMIN | Reembolsar pago |
| `POST` | `/payments/webhook/:provider` | JWT ⚠️ | Webhook de gateway |

**`POST /payments`**
```json
{ "orderId": "uuid", "method": "test" }
```
Solo el metodo `test` procesa pagos actualmente (simulacion 95% exito).

**Alerta:** El endpoint de webhook requiere JWT, lo que impide que gateways reales (Stripe, MercadoPago) envien notificaciones.

---

## Coupons — `/coupons`

| Metodo | Ruta | Guard | Descripcion |
|---|---|---|---|
| `POST` | `/coupons` | JWT + ADMIN | Crear cupon |
| `GET` | `/coupons` | JWT + ADMIN | Listar |
| `POST` | `/coupons/validate` | JWT | Validar cupon (para cliente) |
| `GET` | `/coupons/:id` | JWT + ADMIN | Detalle |
| `PATCH` | `/coupons/:id` | JWT + ADMIN | Actualizar |
| `DELETE` | `/coupons/:id` | JWT + ADMIN | Eliminar |

**`POST /coupons/validate`**
```
Body: { "code": "DESCUENTO10" }
Query: ?cartTotal=150.00
```
Retorna si el cupon es valido, tipo, valor calculado.

---

## Promotions — `/promotions`

| Metodo | Ruta | Guard | Descripcion |
|---|---|---|---|
| `POST` | `/promotions` | JWT + ADMIN | Crear promocion |
| `GET` | `/promotions` | Publico | Listar |
| `GET` | `/promotions/active` | Publico | Solo activas y vigentes |
| `GET` | `/promotions/:id` | Publico | Detalle |
| `PATCH` | `/promotions/:id` | JWT + ADMIN | Actualizar |
| `DELETE` | `/promotions/:id` | JWT + ADMIN | Eliminar |

Las promociones tienen CRUD completo pero no se aplican al calculo de precios en ordenes.

---

## Addresses — `/addresses`

Todos requieren `JWT`.

| Metodo | Ruta | Descripcion |
|---|---|---|
| `POST` | `/addresses` | Crear direccion |
| `GET` | `/addresses` | Listar direcciones del usuario |
| `GET` | `/addresses/default` | Direccion por defecto |
| `GET` | `/addresses/:id` | Detalle |
| `PATCH` | `/addresses/:id` | Actualizar |
| `PATCH` | `/addresses/:id/set-default` | Marcar como default |
| `DELETE` | `/addresses/:id` | Eliminar |

---

## Sections — `/sections`

⚠️ **Sin autenticacion.** Todos los endpoints son publicos.

| Metodo | Ruta | Descripcion |
|---|---|---|
| `POST` | `/sections` | Crear seccion |
| `GET` | `/sections` | Listar |
| `GET` | `/sections/active` | Solo activas (para frontend) |
| `GET` | `/sections/slug/:slug` | Buscar por slug |
| `GET` | `/sections/:id` | Detalle |
| `PUT` | `/sections/:id` | Actualizar |
| `DELETE` | `/sections/:id` | Eliminar |
| `POST` | `/sections/reorder` | Reordenar secciones |
| `POST` | `/sections/:id/items` | Crear item en seccion |
| `GET` | `/sections/:id/items` | Items de una seccion |
| `GET` | `/sections/items/:itemId` | Detalle de item |
| `PUT` | `/sections/items/:itemId` | Actualizar item |
| `DELETE` | `/sections/items/:itemId` | Eliminar item |
| `POST` | `/sections/items/reorder` | Reordenar items |

---

## Profile — `/profile`

Todos requieren `JWT`. El usuario solo accede a su propio perfil.

| Metodo | Ruta | Descripcion |
|---|---|---|
| `GET` | `/profile` | Ver perfil propio |
| `GET` | `/profile/addresses` | Direcciones propias |
| `PATCH` | `/profile` | Actualizar perfil |
