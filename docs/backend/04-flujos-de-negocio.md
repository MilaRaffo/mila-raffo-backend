# 04 — Flujos de Negocio

---

## Flujo de Productos y Variantes

### Crear un Producto

1. Admin envia `POST /products` con nombre, descripcion, precio base, categorias y caracteristicas.
2. El servicio crea el producto.
3. Si hay `categoryIds`, los asocia. **Al asignar una subcategoria, se vinculan automaticamente todas las categorias padre** (expansion jerarquica automatica).
4. Si hay `characteristics`, crea los registros con sus valores en `product_characteristics`.
5. El producto se crea sin variantes ni imagenes inicialmente.

### Crear Variantes

1. Admin envia `POST /variants` con `productId`, `colorId` (opcional), `sku`, `price`, `stock`.
2. El servicio valida: SKU unico, productId existe, colorId existe (si se proporciona).
3. La variante se crea con stock y `is_available` que se pueden definir desde el inicio.

### Subir Imagenes

- `POST /images/upload` sube el archivo a S3 y crea el registro con la URL resultante.
- Las imagenes se asocian a variantes (no a productos directamente).
- La imagen principal del producto en el catalogo es la primera imagen de la primera variante.

### Disponibilidad de una Variante

Una variante se muestra como disponible cuando:
- `variant.is_available === true`
- `variant.product.available === true`
- `variant.stock > 0` — **solo validado al agregar al carrito, no al crear la orden**

### Variante de Personalizacion

**No existe formalmente.** Opciones actuales:
- Se podria crear una variante con `color_id = null` para representar "personalizable".
- El campo `OrderItem.customization` acepta texto libre.
- No hay logica diferenciada para este caso.

---

## Flujo de Compra Directa

```
1. Catalogo
   GET /products/catalog/with-variants
   → Retorna productos con variantes, colores e imagenes

2. Agregar al carrito
   POST /cart/items { variantId, quantity }
   → Valida: variante existe, disponible, producto disponible
   → Valida: quantity <= variant.stock
   → Si la variante ya esta en el carrito, incrementa cantidad

3. Ver carrito
   GET /cart
   → Items enriquecidos: nombre del producto, color, precio, imagen, stock actual

4. Crear orden
   POST /orders { items, shippingAddress, billingAddress, couponCode?, notes? }
   → Valida que variantes existan y esten disponibles
   → ⚠️  No valida stock
   → Calcula precios (ver abajo)
   → Genera numero de orden: ORD-YYMMDD-XXXX
   → Guarda snapshots de producto/precio en OrderItems
   → ⚠️  No descuenta stock
   → ⚠️  No limpia el carrito

5. Pagar
   POST /payments { orderId, method: 'test' }
   → Crea registro de pago en estado pending
   → Simula procesamiento (95% exito)
   → Si exitoso: payment.status = completed, order.payment_status = paid, order.status = confirmed
   → Si falla: payment.status = failed, order.payment_status = failed
```

### Calculo de Precios en la Orden

```
subtotal       = sum(variant.price × quantity)
discount       = calcular segun tipo de cupon (si aplica)
shipping       = cuponAplicado ? $0 : $10  ← hardcodeado
tax            = (subtotal - discount) × 0.08  ← hardcodeado al 8%
total          = subtotal - discount + shipping + tax
```

**Notas sobre el calculo:**
- El costo de envio ($10) y el impuesto (8%) son constantes hardcodeadas en el servicio.
- Cualquier cupon (incluso tipo `percentage` o `fixed_amount`) elimina completamente el costo de envio. Solo deberia hacerlo el tipo `free_shipping`.
- Las promociones activas no afectan el precio.

---

## Flujo de Personalizacion

### Lo que el negocio necesita

1. Admin crea un producto con `is_customizable = true`.
2. El frontend muestra una opcion de "Personalizar" junto a las variantes de color.
3. El cliente selecciona personalizar y debe contactar a la tienda (WhatsApp) para coordinar colores.
4. La tienda confirma que colores estan disponibles.
5. Se registra la orden con la personalizacion confirmada.
6. Solo se personaliza el color — no el diseno ni la estructura.

### Lo que el backend implementa actualmente

| Elemento | Presente | Descripcion |
|---|---|---|
| `Product.is_customizable` | Si | Flag booleano, sin logica asociada |
| `OrderItem.customization` | Si | Texto libre (varchar 200) |
| Variante tipo "personalizacion" | No | No existe `variant_type` ni flag equivalente |
| Estado especial en orden | No | No hay `pending_customization` ni similar |
| Flujo de aprobacion admin | No | No hay workflow de confirmacion |
| Vinculo con WhatsApp | No | No existe referencia a WhatsApp |
| Restriccion: solo color, no diseno | No | No hay validacion |

### Vacios Criticos

- No hay forma de impedir que un cliente agregue al carrito una variante de personalizacion y compre directamente sin coordinacion.
- El campo `customization` es texto sin estructura; no almacena colores especificos, estado de aprobacion ni nada mas.
- No hay notificacion al admin cuando un cliente solicita personalizacion.

---

## Flujo de Cupones

1. Admin crea cupon via `POST /coupons`.
2. Cliente valida el cupon en el frontend via `POST /coupons/validate?cartTotal=X`.
3. Al crear la orden, si se pasa `couponCode`, el servicio valida y aplica el descuento.
4. Se registra el uso en `coupon_usage` y se incrementa `coupon.times_used`.

### Validaciones del cupon (en orden)

1. Codigo existe (case-insensitive)
2. Status es `active`
3. Dentro del rango de fechas
4. No supera el limite de usos total
5. No esta restringido a otro usuario
6. No supera el limite de usos por usuario
7. Cumple el minimo de compra
8. Calcula descuento y lo limita al maximo si esta configurado

---

## Flujo de Cancelacion

- Solo se puede cancelar una orden en estado `pending` o `confirmed`.
- La cancelacion no restaura stock (ya que el stock nunca se desconto al crear la orden).
- No hay cancelacion automatica por timeout de pago.
