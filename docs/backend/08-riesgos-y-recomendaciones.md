# 08 — Riesgos, Vacios e Inconsistencias

---

## Problemas Criticos

| # | Problema | Impacto |
|---|---|---|
| C1 | **Stock no se valida al crear la orden** | Sobreventa: un cliente puede ordenar un producto sin stock real disponible |
| C2 | **Stock no se descuenta al confirmar el pago** | Multiples clientes pueden comprar el mismo stock porque nunca se reduce |
| C3 | **Secciones del frontend sin autenticacion** | Cualquier persona puede crear, modificar o eliminar el contenido del homepage |
| C4 | **Webhook de pagos requiere JWT** | Imposible integrar Stripe, MercadoPago u otro gateway; nunca podran enviar notificaciones |

---

## Problemas Altos

| # | Problema | Impacto |
|---|---|---|
| A1 | **Carrito no se limpia al crear la orden** | UX confusa: el usuario ve sus items en el carrito despues de haber comprado |
| A2 | **Sin maquina de estados para ordenes** | Un admin puede cambiar una orden de `pending` a `delivered` directamente sin pasar por los estados intermedios |
| A3 | **Personalizacion sin flujo diferenciado** | No hay forma de distinguir una orden personalizada, ni de gestionar la coordinacion con el cliente |
| A4 | **Token blacklist sin cache** | Cada request autenticado hace una query a la DB; degradacion de performance con escala |
| A5 | **`invalidateAllUserTokens()` no implementado** | Si un usuario es comprometido, no hay mecanismo para invalidar todos sus tokens activos |
| A6 | **Promociones no se aplican a ordenes** | El modulo tiene CRUD completo pero no afecta ningun precio; feature completamente desconectada |

---

## Problemas Medios

| # | Problema | Impacto |
|---|---|---|
| M1 | **Costo de envio hardcodeado** | Siempre $10, sin considerar ubicacion, peso ni valor del pedido |
| M2 | **Tasa de impuesto hardcodeada** | Siempre 8%, sin considerar jurisdiccion |
| M3 | **Cupon elimina envio sin importar su tipo** | Un cupon de descuento porcentual tambien pone el envio en $0; deberia ser solo `free_shipping` |
| M4 | **Sin concepto de canal de compra** | No se registra si la orden vino de la web o de WhatsApp; no hay trazabilidad |
| M5 | **Sin integracion WhatsApp** | No hay registro, seguimiento ni vinculo de pedidos originados por WhatsApp |
| M6 | **TransformInterceptor definido pero no registrado** | Las respuestas no tienen el envelope `{data, timestamp, path}` aunque el interceptor existe |
| M7 | **`synchronize: true` en desarrollo** | Si `NODE_ENV` no esta bien configurado en produccion, TypeORM podria modificar el esquema |
| M8 | **Sin migraciones de base de datos** | El esquema depende de `synchronize`; no hay historial de cambios |

---

## Problemas Bajos

| # | Problema | Impacto |
|---|---|---|
| B1 | **Sin auditoria de cambios** | No se registra quien cambio un precio, stock, o estado de orden, ni cuando |
| B2 | **Sin historial de movimientos de stock** | No hay forma de saber cuando ni por que cambio el stock de una variante |
| B3 | **Imagen de producto depende de variante** | Si una variante no tiene imagenes, el producto aparece sin imagen |
| B4 | **N+1 queries en expansion de categorias** | `expandCategoryIdsWithParents()` consulta la DB por cada padre; problema en catalogos grandes |
| B5 | **Sin tests unitarios** | Solo existe un test placeholder; cualquier cambio puede romper logica sin detectarse |

---

## Recomendaciones

### Critico (implementar antes de lanzar)

1. **Validar y descontar stock al crear/confirmar ordenes**
   - Verificar `variant.stock >= quantity` en `OrdersService.create()`.
   - Descontar stock atomicamente al confirmar pago via transaccion DB.
   - Restaurar stock si la orden se cancela.
   - Usar `SELECT ... FOR UPDATE` para evitar race conditions con compras simultaneas.

2. **Proteger endpoints de secciones**
   - Agregar `JWT + ADMIN` a todos los endpoints de escritura en `SectionsController`.
   - Los endpoints de lectura (`GET /sections/active`, `GET /sections/slug/:slug`) pueden seguir siendo publicos.

3. **Eliminar JWT del webhook de pagos**
   - Reemplazar por validacion de firma HMAC (estandar de todos los gateways).
   - Opcionalmente agregar whitelist de IPs del gateway.

### Alto

4. **Limpiar carrito al crear orden exitosamente**
   - Llamar `CartService.clearCart(userId)` al final de `OrdersService.create()`.

5. **Implementar maquina de estados para ordenes**
   - Definir transiciones validas y rechazar las invalidas en `OrdersService.update()`.
   - Transiciones sugeridas: `pending → confirmed → processing → shipped → delivered`.

6. **Disenar el flujo de personalizacion**
   - Agregar campo `variant_type` (enum: `standard` | `customization`) a `Variant`.
   - Impedir que variantes de tipo `customization` se compren directamente sin aprobacion.
   - Considerar una entidad `CustomizationRequest` para trackear solicitudes.
   - Agregar estado `pending_customization` en la orden.

7. **Agregar cache a la blacklist de tokens**
   - Implementar Redis o cache en memoria (LRU) para la verificacion de tokens.

8. **Implementar `invalidateAllUserTokens()`**
   - Necesario para responder a compromisos de seguridad y cambios de password.

### Medio

9. **Canal de compra en la orden**
   - Agregar campo `channel` (enum: `web` | `whatsapp` | `manual`) a `Order`.
   - Permitir a admins crear ordenes manuales para pedidos por WhatsApp.

10. **Corregir logica de cupon y envio**
    - Solo eliminar costo de envio si el cupon es de tipo `free_shipping`.

11. **Hacer configurables envio e impuestos**
    - Extraer a variables de entorno o tabla de configuracion.

12. **Decidir el destino del modulo de Promotions**
    - Integrarlo en el calculo de precios de ordenes, o eliminarlo si no se va a usar.

13. **Implementar migraciones**
    - Desactivar `synchronize: true` en produccion y usar migraciones formales de TypeORM.

### Bajo

14. **Agregar historial de movimientos de stock**
    - Tabla `stock_movements`: variante, cantidad, tipo (entrada/salida/ajuste), referencia, usuario, fecha.

15. **Agregar tests**
    - Priorizar: `OrdersService`, `CartService`, `CouponsService`, `AuthService`.

16. **Permitir imagenes directas en productos**
    - Ademas de imagenes por variante, permitir imagenes de presentacion del producto base.
