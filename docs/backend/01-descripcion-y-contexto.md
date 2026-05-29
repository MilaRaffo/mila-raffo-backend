# 01 — Descripcion General y Contexto de Negocio

---

## Que es

El backend de Mila Raffo es una API REST construida con **NestJS** (v11), **TypeORM** (v0.3) y **PostgreSQL**. Sirve como motor de un ecommerce orientado a la venta de accesorios de cuero artesanales hechos a mano.

## Que problema resuelve

- Gestionar un catalogo de productos con variantes por color.
- Manejar stock limitado a nivel de variante.
- Procesar ordenes de compra con cupones de descuento.
- Administrar usuarios con roles diferenciados (cliente, admin, superadmin).
- Subir imagenes a Amazon S3.
- Gestionar secciones de contenido para el frontend (hero, carrusel, catalogo).
- Autenticacion JWT con blacklist de tokens y refresh tokens.

## Stack Tecnologico

| Componente | Tecnologia |
|---|---|
| Framework | NestJS 11 |
| Lenguaje | TypeScript 5.7 |
| ORM | TypeORM 0.3.28 |
| Base de datos | PostgreSQL |
| Autenticacion | JWT + Passport + bcrypt |
| Almacenamiento | Amazon S3 |
| Documentacion API | Swagger |
| Validacion | class-validator + class-transformer |
| Rate limiting | @nestjs/throttler |
| Tareas programadas | @nestjs/schedule (cron) |
| Logging | Winston + winston-daily-rotate-file |

---

## Contexto de Negocio

### Productos

Cada producto representa un **modelo base** de accesorio artesanal (cartera, mochila, tote, billetera, etc.).

- La entidad `Product` tiene `name`, `description`, `base_price`, `available` e `is_customizable`.
- El campo `is_customizable` (boolean) existe, indicando que el sistema contempla personalizacion a nivel de producto.
- Un producto puede tener multiples variantes, categorias y caracteristicas.

### Variantes

Cada variante representa una **version especifica del producto determinada por el color**.

- La entidad `Variant` tiene: `sku`, `price`, `stock`, `is_available` y una relacion con `Color`.
- El color es una entidad independiente con `name`, `code` y `hex`.
- La relacion `variant → color` es nullable (permite variantes sin color).
- Cada variante tiene su propio precio independiente del `base_price` del producto.
- Las imagenes se asocian a variantes, no a productos directamente.

### Stock

- El stock se maneja a nivel de variante (`variant.stock`, entero, default 0).
- Existe `VariantsService.updateStock(id, quantity)` que suma o resta (con piso en 0).
- **Problema critico:** El stock solo se valida al agregar items al carrito. Al crear una orden no se verifica ni se descuenta.

### Personalizacion

**Lo que el negocio necesita:** algunos productos permiten personalizacion de color; el cliente debe contactar a la tienda para coordinar; no se cambia diseno, solo color.

**Lo que el backend implementa actualmente:**
- `Product.is_customizable` existe como flag booleano.
- `OrderItem.customization` existe como campo de texto opcional (varchar 200).
- **No existe** una variante especial de tipo "personalizacion".
- **No existe** logica diferenciada para el flujo de personalizacion.

### Canales de Compra

- Compra online y via WhatsApp son los canales del negocio.
- El backend solo implementa el flujo de compra online.
- **No existe** ningun concepto de canal (`web`, `whatsapp`) en el modelo de datos.
- **No hay** integracion ni registro de pedidos por WhatsApp.

### WhatsApp

No hay ninguna referencia a WhatsApp en todo el backend actual.
