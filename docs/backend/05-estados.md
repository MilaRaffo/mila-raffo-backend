# 05 — Estados del Sistema

---

## Estado de la Orden (`Order.status`)

| Estado | Significado | Transicion desde |
|---|---|---|
| `pending` | Creada, esperando pago | Inicial (al crear la orden) |
| `confirmed` | Pago recibido | `pending` → automatico al confirmar pago |
| `processing` | En preparacion | `confirmed` → manual por admin |
| `shipped` | Enviada | `processing` → manual por admin |
| `delivered` | Entregada | `shipped` → manual por admin |
| `cancelled` | Cancelada | `pending` o `confirmed` |
| `refunded` | Reembolsada | No gestionado explicitamente |

**Problema identificado:** No existe validacion de transiciones de estado (excepto en cancel). Un admin puede cambiar el estado a cualquier valor sin restriccion via `PATCH /orders/:id`.

---

## Estado del Pago en la Orden (`Order.payment_status`)

| Estado | Significado |
|---|---|
| `pending` | Esperando pago |
| `paid` | Pago recibido y confirmado |
| `failed` | Intento de pago fallido |
| `refunded` | Monto reembolsado |

---

## Estado del Payment (`Payment.status`)

| Estado | Significado |
|---|---|
| `pending` | Registro creado, no procesado |
| `processing` | En proceso (para gateways async) |
| `completed` | Pago exitoso |
| `failed` | Pago rechazado o fallido |
| `refunded` | Reembolsado |
| `cancelled` | Cancelado antes de procesar |

---

## Estado del Cupon (`Coupon.status`)

| Estado | Significado | Transicion |
|---|---|---|
| `active` | Disponible para uso | Manual por admin, o inicial |
| `inactive` | Desactivado manualmente | Manual por admin |
| `expired` | Fecha de vigencia pasada | Automatico via cron |
| `exhausted` | Limite de usos alcanzado | Automatico al registrar uso |

**Tarea programada:** `CouponsService.updateExpiredCoupons()` actualiza masivamente cupones activos cuya `valid_until` ya paso.

---

## Estado de la Promocion (`Promotion.status`)

| Estado | Significado |
|---|---|
| `active` | Vigente |
| `inactive` | Desactivada manualmente |
| `scheduled` | Programada, aun no comienza |
| `expired` | Fecha de fin pasada |

**Tarea programada:** `PromotionsService.updateStatus()` activa las `scheduled` y expira las vencidas.

---

## Disponibilidad de Producto y Variante

No hay un "estado" formal para productos o variantes; se controla mediante flags booleanos:

| Campo | Entidad | Significado |
|---|---|---|
| `Product.available` | Product | Si el producto aparece en el catalogo |
| `Variant.is_available` | Variant | Si la variante puede comprarse |
| `Variant.stock` | Variant | Unidades fisicamente disponibles |
| `Color.isActive` | Color | Si el color esta activo en el sistema |

Una variante esta comprable cuando: `is_available = true` AND `product.available = true` AND `stock > 0` (este ultimo solo validado en carrito).

---

## Estados de Personalizacion

**No existen.** No hay estados como `pending_customization`, `customization_confirmed`, `in_production`, etc.

Para ordenes personalizadas el sistema no diferencia nada: usan los mismos estados que una orden normal.
