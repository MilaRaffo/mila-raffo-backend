# 07 — Servicios y Logica Interna

---

## AuthService

**Responsabilidad:** Registro, login, logout y renovacion de tokens JWT.

| Metodo | Descripcion | Detalle |
|---|---|---|
| `register()` | Crea usuario con rol `client`, retorna tokens | Busca el rol "client" y lo asigna automaticamente |
| `login()` | Valida credenciales, retorna tokens | bcrypt.compare; verifica `isActive` |
| `logout()` | Invalida ambos tokens | Agrega access + refresh a la blacklist con razon `LOGOUT` |
| `refreshToken()` | Emite nuevo par de tokens | Verifica blacklist, verifica con `JWT_REFRESH_SECRET` |

**Punto critico:** No hay rate limiting especifico para login (solo el global de throttler).

El payload JWT es: `{ sub: UUID, email: string, role: RoleName }`.

---

## TokenBlacklistService

**Responsabilidad:** Registrar y verificar tokens invalidados.

| Metodo | Descripcion |
|---|---|
| `addToBlacklist()` | Decodifica token para obtener exp, guarda en DB |
| `isBlacklisted()` | Consulta DB por el token exacto |
| `cleanupExpiredTokens()` | Elimina tokens cuyo `expires_at < now` (cron diario 3AM) |
| `invalidateAllUserTokens()` | **Stub — no implementado.** Solo registra un log |

**Punto critico:** Cada request autenticado genera una query a la DB. Sin cache, esto escala mal.

---

## ProductsService

**Responsabilidad:** CRUD de productos con sus categorias y caracteristicas.

| Metodo | Descripcion | Detalle |
|---|---|---|
| `create()` | Crea producto + asociaciones | Llama a `addCategoriesToProduct` y crea characteristics |
| `findAll()` | Lista con filtros | QueryBuilder con joins a variants, images, categories, colors |
| `findProductsWithVariants()` | Vista catalogo ligera | Incluye primera imagen y color de cada variante |
| `update()` | Actualiza campos y reemplaza categorias/characteristics | |
| `remove()` | Soft delete | |

**Comportamiento especial — expansion de categorias:**
Al asignar `categoryIds`, el metodo `expandCategoryIdsWithParents()` recorre la jerarquia y agrega automaticamente las categorias padre. Potencial N+1 queries en jerarquias profundas.

---

## VariantsService

**Responsabilidad:** CRUD de variantes y gestion de stock.

| Metodo | Descripcion | Detalle |
|---|---|---|
| `create()` | Crea variante | Valida SKU unico, productId y colorId |
| `updateStock()` | Modifica stock | `Math.max(0, stock + quantity)` — acepta valores negativos |
| `findAll()` | Lista variantes | Con color e imagenes |

**Punto critico:** `updateStock()` existe y funciona, pero **nunca es llamado automaticamente**. El stock solo cambia via `PATCH /variants/:id` manual por el admin.

---

## CartService

**Responsabilidad:** Gestion del carrito de compras por usuario.

| Metodo | Descripcion | Validaciones |
|---|---|---|
| `addItem()` | Agrega o incrementa cantidad | Variante existe, disponible, producto disponible, `quantity <= stock` |
| `getCart()` | Carrito enriquecido | Incluye nombre, color, precio, imagen, stock actual |
| `updateItem()` | Cambia cantidad | Valida nueva cantidad contra stock |
| `removeItem()` | Elimina item | Verifica que pertenezca al usuario |
| `clearCart()` | Vacia carrito | — |

**Punto critico:** La validacion de stock en el carrito no garantiza disponibilidad al momento de pagar. Puede pasar tiempo entre agregar al carrito y crear la orden.

---

## OrdersService

**Responsabilidad:** Creacion, consulta y actualizacion de ordenes.

| Metodo | Descripcion | Detalle |
|---|---|---|
| `create()` | Crea orden completa | Ver flujo abajo |
| `findAll()` | Lista ordenes del usuario | Paginado |
| `findOne()` | Detalle con items | — |
| `cancel()` | Cancela orden | Solo si `pending` o `confirmed` |
| `updatePaymentStatus()` | Cambia estado de pago | `PAID` → auto-confirma la orden |

**Flujo de `create()`:**
1. Obtiene variantes con sus productos.
2. Valida disponibilidad (`is_available`, `product.available`).
3. **No valida stock.**
4. Calcula subtotal, aplica cupon si hay, calcula envio y tax.
5. Genera numero de orden `ORD-YYMMDD-XXXX` (secuencia diaria).
6. Crea snapshots de nombre/SKU/precio en cada `OrderItem`.
7. Registra uso del cupon si aplica.
8. **No descuenta stock.**
9. **No limpia el carrito.**

**Constantes hardcodeadas:**
- Costo de envio: `$10` (o `$0` si hay cualquier cupon activo)
- Impuesto: `8%`

---

## PaymentsService

**Responsabilidad:** Procesamiento de pagos.

| Metodo | Descripcion | Detalle |
|---|---|---|
| `create()` | Registra intento de pago | Valida que la orden exista, pertenezca al usuario, no este pagada |
| `processTestPayment()` | Simula pago | 95% exito; genera `TEST-{timestamp}` como transactionId |
| `refund()` | Reembolsa pago | Solo admin; solo pagos `completed` |
| `handleWebhook()` | Recibe notificacion de gateway | **Stub — no implementado** |

**Punto critico:** El webhook requiere autenticacion JWT, lo que impide integraciones reales con Stripe, MercadoPago, etc.

---

## CouponsService

**Responsabilidad:** Gestion y validacion de cupones.

| Metodo | Descripcion | Detalle |
|---|---|---|
| `validateCoupon()` | Valida y calcula descuento | 7 validaciones en cadena (ver abajo) |
| `recordUsage()` | Registra uso | Incrementa `times_used`, marca como `exhausted` si aplica |
| `updateExpiredCoupons()` | Actualiza expirados | Batch: `active` → `expired` cuando `valid_until < now` |

**Validaciones de `validateCoupon()`** (en orden):
1. Codigo existe (case-insensitive)
2. Status es `active`
3. Dentro del rango de fechas
4. Limite total de usos no superado
5. No restringido a otro usuario
6. Limite por usuario no superado
7. Minimo de compra cumplido

**Calculo del descuento:**
- `percentage`: `cartTotal × value / 100`
- `fixed_amount`: `value`
- `free_shipping`: descuento = 0, pero elimina shipping en la orden

---

## PromotionsService

**Responsabilidad:** CRUD de campanas promocionales.

| Metodo | Descripcion | Estado |
|---|---|---|
| `create()` | Crea y vincula a productos/categorias | Implementado |
| `findActive()` | Filtra activas y vigentes | Implementado |
| `getApplicablePromotions()` | Busca por producto/categoria | Implementado, pero **nunca es invocado** |
| `updateStatus()` | Activa scheduled, expira vencidas | Implementado |

**Punto critico:** Las promociones no afectan el calculo de precios. Todo el modulo existe pero esta desconectado del flujo de compra.

---

## AddressesService

| Metodo | Descripcion |
|---|---|
| `create()` | Crea direccion; si `is_default`, desmarca todas las otras del usuario |
| `update()` | Misma logica de default |
| `setDefault()` | Desmarca todas las del usuario y marca la solicitada |

---

## SectionsService

| Metodo | Descripcion |
|---|---|
| `reorderSections()` | Recibe array de IDs, asigna `order` segun la posicion en el array |
| `reorderSectionItems()` | Igual, para items |
| `findAllSectionsActive()` | Solo activas, ordenadas por `order` |

**Punto critico:** No hay autenticacion en ninguno de los endpoints del controller.
