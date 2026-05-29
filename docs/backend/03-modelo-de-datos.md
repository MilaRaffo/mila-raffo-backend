# 03 — Modelo de Datos

---

## BaseEntity (abstracta)

Todas las entidades principales heredan de `BaseEntity`.

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | UUID | Clave primaria, generada automaticamente |
| `created_at` | timestamp | Fecha de creacion |
| `updated_at` | timestamp | Fecha de ultima actualizacion |
| `deleted_at` | timestamp (nullable) | Soft delete — el registro no se borra fisicamente |

**Excepciones:** `ProductCategory` y `ProductCharacteristic` no heredan de BaseEntity; usan claves primarias compuestas.

---

## Diagrama de Relaciones (Simplificado)

```
Role ──1:N──> User ──1:N──> Address
                │
                ├──1:N──> CartItem ──N:1──> Variant
                ├──1:N──> WishlistItem ──N:1──> Variant
                ├──1:N──> Order ──1:N──> OrderItem ──N:1──> Variant
                │            └──1:N──> Payment
                └──1:N──> CouponUsage ──N:1──> Coupon

Product ──1:N──> Variant ──N:1──> Color
    │                └──1:N──> Image
    ├──N:M──> Category        (via ProductCategory)
    ├──N:M──> Characteristic  (via ProductCharacteristic + value)
    └──N:M──> Promotion       (via promotion_products)

Category ──N:M──> Promotion   (via promotion_categories)
         ──self──> Category   (parent/children)

Section ──1:N──> SectionItem ──N:1──> Image
```

---

## Entidades

### User — `users`

Representa un usuario del sistema (cliente, admin o superadmin).

| Campo | Tipo | Restricciones | Descripcion |
|---|---|---|---|
| `name` | varchar(100) | requerido | Nombre |
| `last_name` | varchar(100) | requerido | Apellido |
| `email` | varchar(255) | unico | Email, usado como login |
| `password` | varchar(255) | excluido de select | Hash bcrypt (10 rounds) |
| `phone` | varchar(20) | nullable | Telefono |
| `role_id` | UUID FK | — | Referencia al rol |
| `isActive` | boolean | default true | Si el usuario esta activo |

Relaciones: `ManyToOne → Role` (eager), `OneToMany → Address`

Reglas: email unico; un admin no puede modificar ni eliminar a otro admin o superadmin.

---

### Role — `roles`

| Campo | Tipo | Descripcion |
|---|---|---|
| `name` | varchar(50) unico | Valores: `client`, `admin`, `superadmin` |
| `description` | text nullable | — |

---

### Product — `products`

Modelo base de un accesorio artesanal.

| Campo | Tipo | Descripcion |
|---|---|---|
| `name` | varchar(200) | Nombre del producto |
| `description` | text nullable | Descripcion |
| `base_price` | decimal(10,2) | Precio base de referencia (cada variante tiene su propio precio) |
| `available` | boolean (default true) | Si aparece en el catalogo |
| `is_customizable` | boolean (default false) | Si permite personalizacion de color |

Relaciones: `OneToMany → Variant`, `OneToMany → ProductCategory`, `OneToMany → ProductCharacteristic`

Nota: Las imagenes se asocian a variantes, no al producto. El sistema usa la primera imagen de la primera variante como imagen principal.

---

### Variant — `variants`

Version especifica de un producto, determinada principalmente por el color.

| Campo | Tipo | Descripcion |
|---|---|---|
| `product_id` | UUID FK | Producto al que pertenece |
| `color_id` | UUID FK nullable | Color de esta variante |
| `sku` | varchar(100) unico | Codigo unico |
| `price` | decimal(10,2) | Precio de venta |
| `stock` | int (default 0) | Unidades disponibles |
| `is_available` | boolean (default true) | Si esta habilitada para compra |

Relaciones: `ManyToOne → Product`, `ManyToOne → Color` (nullable, eager), `OneToMany → Image`

Notas:
- `is_available` es independiente del stock.
- `color_id` nullable permite crear variantes sin color (posible uso para personalizacion, no formalizado).

---

### Color — `colors`

| Campo | Tipo | Descripcion |
|---|---|---|
| `name` | varchar(100) | Nombre visible (ej: "Negro") |
| `code` | varchar(50) unico | Codigo interno (ej: "negro") |
| `hex` | varchar(7) | Codigo hexadecimal (ej: "#000000") |
| `isActive` | boolean (default true) | Si esta activo |

---

### Category — `categories`

| Campo | Tipo | Descripcion |
|---|---|---|
| `name` | varchar(100) | Nombre |
| `slug` | varchar(100) unico | Slug URL-friendly |
| `description` | text nullable | — |
| `parent_id` | UUID nullable | Categoria padre (auto-referencia) |
| `active` | boolean (default true) | Si esta activa |

Al asignar una categoria a un producto, el sistema **expande automaticamente la jerarquia**: se vinculan tambien todas las categorias padre.

---

### ProductCategory — `product_categories`

Tabla pivote N:M entre Product y Category. Clave primaria compuesta: `(product_id, category_id)`. No tiene timestamps.

---

### Characteristic — `characteristics`

| Campo | Tipo | Descripcion |
|---|---|---|
| `name` | varchar(100) | Nombre (ej: "Ancho", "Material") |
| `data_type` | enum | `text`, `number`, `bool` |
| `units` | enum nullable | `Kg`, `g`, `m`, `cm`, `mm`, `L`, `in` |

---

### ProductCharacteristic — `product_characteristics`

Tabla pivote N:M con valor. Clave primaria compuesta: `(product_id, characteristic_id)`.

| Campo adicional | Tipo | Descripcion |
|---|---|---|
| `value` | varchar(500) | Valor para ese producto (ej: "30", "Cuero italiano") |

---

### Image — `images`

| Campo | Tipo | Descripcion |
|---|---|---|
| `variant_id` | UUID FK nullable | Variante asociada |
| `url` | varchar(500) | URL (S3 o externa) |
| `alt` | varchar(255) nullable | Texto alternativo |

Las imagenes pueden existir sin variante; en ese caso son usadas por `SectionItem`.

---

### CartItem — `cart_items`

| Campo | Tipo | Descripcion |
|---|---|---|
| `user_id` | UUID FK | Usuario propietario |
| `variant_id` | UUID FK | Variante seleccionada |
| `quantity` | int (default 1) | Cantidad |

Restriccion unica: `[user_id, variant_id]`. Si el mismo usuario agrega la misma variante, se incrementa la cantidad.

Validaciones al agregar: variante disponible, producto disponible, `quantity <= variant.stock`.

---

### Order — `orders`

| Campo | Tipo | Descripcion |
|---|---|---|
| `order_number` | varchar(50) unico | Formato: `ORD-YYMMDD-XXXX` |
| `user_id` | UUID FK | Usuario |
| `status` | enum | Estado de la orden (ver [Estados](./05-estados.md)) |
| `payment_status` | enum | Estado del pago |
| `subtotal` | decimal(10,2) | Antes de descuentos |
| `discount_amount` | decimal(10,2) default 0 | Descuento aplicado |
| `shipping_cost` | decimal(10,2) default 0 | Costo de envio |
| `tax_amount` | decimal(10,2) default 0 | Impuesto (8% hardcodeado) |
| `total` | decimal(10,2) | Total final |
| `coupon_id` | UUID nullable | Cupon usado |
| `coupon_code` | varchar(50) nullable | Codigo del cupon |
| `notes` | text nullable | Notas del cliente |
| `tracking_number` | varchar(100) nullable | Numero de seguimiento |
| `shipped_at` / `delivered_at` | timestamp nullable | Fechas de logistica |
| Campos de direccion de envio | varchar | `shipping_first_name`, `shipping_last_name`, `shipping_street_address`, `shipping_city`, `shipping_postal_code`, `shipping_country`, `shipping_phone`, etc. |
| Campos de direccion de facturacion | varchar | Mismos campos con prefijo `billing_` |

Relaciones: `ManyToOne → User`, `OneToMany → OrderItem` (cascade, eager)

---

### OrderItem — `order_items`

| Campo | Tipo | Descripcion |
|---|---|---|
| `order_id` | UUID FK | Orden |
| `variant_id` | UUID FK | Variante comprada |
| `product_name` | varchar(200) | **Snapshot** del nombre al momento de la compra |
| `sku` | varchar(100) | **Snapshot** del SKU |
| `unit_price` | decimal(10,2) | **Snapshot** del precio unitario |
| `quantity` | int | Cantidad |
| `subtotal` | decimal(10,2) | quantity × unit_price |
| `discount` | decimal(10,2) default 0 | Descuento en este item |
| `total` | decimal(10,2) | subtotal − discount |
| `customization` | varchar(200) nullable | Texto de personalizacion (sin estructura) |

Los campos snapshot (`product_name`, `sku`, `unit_price`) se copian en el momento de la creacion para que la orden sea inmutable ante cambios futuros en el catalogo.

---

### Payment — `payments`

| Campo | Tipo | Descripcion |
|---|---|---|
| `order_id` | UUID FK | Orden asociada |
| `user_id` | UUID FK | Usuario que paga |
| `amount` | decimal(10,2) | Monto |
| `method` | enum | `test`, `credit_card`, `debit_card`, `paypal`, `stripe`, `mercadopago`, `bank_transfer` |
| `status` | enum | Estado del pago (ver [Estados](./05-estados.md)) |
| `transaction_id` | varchar(255) nullable | ID externo del gateway |
| `payment_gateway_response` | varchar(255) nullable | Respuesta del gateway |
| `error_message` | text nullable | Error si falla |
| `processed_at` | timestamp nullable | Fecha de procesamiento |
| `metadata` | jsonb nullable | Datos adicionales |

Solo el metodo `test` esta implementado (simulacion con 95% de exito). Los demas metodos estan declarados pero no implementados.

---

### Coupon — `coupons`

| Campo | Tipo | Descripcion |
|---|---|---|
| `code` | varchar(50) unico | Codigo (siempre uppercase) |
| `type` | enum | `percentage`, `fixed_amount`, `free_shipping` |
| `value` | decimal(10,2) | Valor del descuento |
| `minimum_purchase` | decimal nullable | Compra minima requerida |
| `maximum_discount` | decimal nullable | Descuento maximo aplicable |
| `usage_limit` | int nullable | Limite total de usos |
| `times_used` | int default 0 | Veces usado |
| `usage_limit_per_user` | int nullable | Limite por usuario |
| `valid_from` / `valid_until` | timestamp nullable | Vigencia |
| `status` | enum | `active`, `inactive`, `expired`, `exhausted` |
| `is_single_use` | boolean default false | Un solo uso |
| `restricted_to_user_id` | UUID nullable | Restringido a un usuario especifico |

---

### CouponUsage — `coupon_usage`

| Campo | Tipo | Descripcion |
|---|---|---|
| `coupon_id` | UUID FK | Cupon |
| `user_id` | UUID FK | Usuario |
| `order_id` | UUID FK nullable | Orden |
| `discount_applied` | decimal(10,2) | Descuento aplicado |

---

### Promotion — `promotions`

| Campo | Tipo | Descripcion |
|---|---|---|
| `type` | enum | `percentage`, `fixed_amount`, `buy_x_get_y`, `free_shipping` |
| `status` | enum | `active`, `inactive`, `scheduled`, `expired` |
| `start_date` / `end_date` | timestamp | Vigencia |
| `is_stackable` | boolean | Si se acumula con otras promociones |
| `priority` | int default 0 | Prioridad de aplicacion |

Relaciones: `ManyToMany → Product`, `ManyToMany → Category`

**Las promociones no se aplican a ordenes actualmente.** El modulo tiene CRUD completo pero no esta integrado con el calculo de precios.

---

### Address — `addresses`

| Campo | Tipo | Descripcion |
|---|---|---|
| `user_id` | UUID FK | Usuario |
| `street_address` | varchar(200) | Calle y numero |
| `apartment` | varchar(100) nullable | Departamento u oficina |
| `city` / `state_province` / `postal_code` / `country` | varchar | — |
| `phone` | varchar(20) nullable | — |
| `is_default` | boolean default false | Direccion principal del usuario |
| `latitude` / `longitude` | decimal(10,7) nullable | Coordenadas |

Al marcar una direccion como default, se desmarca cualquier otra del mismo usuario.

---

### Section — `sections` / SectionItem — `section_items`

CMS ligero para el frontend.

**Section:**

| Campo | Tipo | Descripcion |
|---|---|---|
| `type` | enum | `hero`, `carousel`, `featured_catalog`, `categories`, `testimonials`, `banners` |
| `slug` | varchar(100) unico | Identificador URL |
| `is_active` | boolean default true | Activa o no |
| `order` | int default 0 | Orden de aparicion |

**SectionItem:**

| Campo | Tipo | Descripcion |
|---|---|---|
| `section_id` | UUID FK | Seccion padre |
| `image_id` | UUID FK nullable | Imagen asociada (eager) |
| `url` | varchar(500) nullable | Enlace |
| `order` | int default 0 | Orden |
| `extra_data` | simple-json nullable | Datos adicionales en JSON |

**Alerta:** Los endpoints de secciones no tienen autenticacion. Cualquiera puede modificar el contenido del frontend.

---

### TokenBlacklist — `token_blacklist`

| Campo | Tipo | Descripcion |
|---|---|---|
| `token` | text unico | Token JWT completo |
| `tokenType` | enum | `access`, `refresh`, `reset_password`, `email_verification` |
| `user_id` | UUID | Usuario asociado |
| `reason` | enum | `logout`, `password_changed`, `token_used`, `security_breach`, `manual_revocation` |
| `expires_at` | timestamp | Fecha de expiracion del token |

Tarea programada: limpieza diaria a las 3:00 AM de tokens expirados.
