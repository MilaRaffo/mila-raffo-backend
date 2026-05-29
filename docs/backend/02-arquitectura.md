# 02 — Arquitectura del Backend

---

## Estructura de Carpetas

```
src/
├── main.ts                          # Punto de entrada, configuracion global
├── app.module.ts                    # Modulo raiz, registro de todos los modulos
├── app.controller.ts                # Health check: GET /
│
├── config/                          # Configuracion de servicios externos
│   ├── database.config.ts           # Conexion PostgreSQL
│   ├── jwt.config.ts                # Secretos y tiempos de expiracion JWT
│   └── s3.config.ts                 # Credenciales AWS S3
│
├── common/                          # Utilidades compartidas (sin logica de negocio)
│   ├── entities/base.entity.ts      # UUID + timestamps + soft delete
│   ├── decorators/                  # @GetUser, @Roles, @LogAction, @ResourceAction
│   ├── dto/pagination.dto.ts        # Paginacion y filtros reutilizables
│   ├── enums/                       # DataType, Measureunits
│   ├── filters/                     # AllExceptionsFilter (global)
│   ├── interceptors/                # Logging HTTP, business log, transform
│   ├── interfaces/                  # PaginatedResult<T>
│   ├── pipes/                       # ParseIntPipe personalizado
│   └── services/                    # LoggerModule + LoggerService (Winston)
│
├── auth/                            # Autenticacion y autorizacion
├── users/                           # Gestion de usuarios
├── roles/                           # Roles del sistema
├── products/                        # Catalogo de productos
├── variants/                        # Variantes de productos
├── categories/                      # Categorias jerarquicas
├── characteristics/                 # Caracteristicas de productos
├── colors/                          # Colores para variantes
├── images/                          # Imagenes con upload a S3
├── cart/                            # Carrito de compras
├── wishlist/                        # Lista de deseos
├── orders/                          # Ordenes de compra
├── payments/                        # Pagos
├── coupons/                         # Cupones de descuento
├── promotions/                      # Promociones (modulo existente, no integrado)
├── addresses/                       # Direcciones de envio del usuario
├── sections/                        # Secciones CMS del frontend
├── profile/                         # Perfil del usuario autenticado
│
└── database/seeds/                  # Scripts de datos iniciales

scripts/
├── seed.ts                          # Seed principal (roles + catalogo)
└── seed-catalog.ts                  # Seed solo catalogo
```

---

## Modulos Principales

| Modulo | Entidades | Responsabilidad |
|---|---|---|
| AuthModule | TokenBlacklist | Login, registro, logout, refresh token |
| UsersModule | User | CRUD de usuarios (solo admin) |
| RolesModule | Role | Gestion de roles (solo superadmin) |
| ProductsModule | Product, ProductCategory, ProductCharacteristic | Catalogo de productos |
| VariantsModule | Variant | Variantes, stock, precios |
| CategoriesModule | Category | Arbol jerarquico de categorias |
| CharacteristicsModule | Characteristic | Dimensiones, materiales, etc. |
| ColorsModule | Color | Colores disponibles |
| ImagesModule | Image | Gestion e imagenes, upload S3 |
| CartModule | CartItem | Carrito por usuario |
| WishlistModule | WishlistItem | Lista de deseos |
| OrdersModule | Order, OrderItem | Ordenes de compra |
| PaymentsModule | Payment | Pagos (solo modo test activo) |
| CouponsModule | Coupon, CouponUsage | Cupones de descuento |
| PromotionsModule | Promotion | Campanas promocionales (no integrado) |
| AddressesModule | Address | Direcciones de usuario |
| SectionsModule | Section, SectionItem | CMS de secciones del frontend |
| ProfileModule | — | Wrapper de perfil para usuario autenticado |

---

## Patron Arquitectonico

El proyecto sigue la **arquitectura modular de NestJS**:

- Cada dominio de negocio es un modulo (`@Module`) independiente.
- Cada modulo contiene: **controller** (rutas), **service** (logica), **entities** (DB), **DTOs** (validacion).
- Los modulos se comunican via inyeccion de dependencias.

**No existe capa de repositorio explicita.** Los servicios usan `@InjectRepository()` directamente.

**No existe capa de eventos ni message queue.**

---

## Flujo General de una Request

```
Request HTTP
    ↓
ThrottlerGuard (rate limiting global)
    ↓
ValidationPipe (valida y transforma DTOs)
    ↓
JwtAuthGuard (verifica token + blacklist)
    ↓
RolesGuard (verifica rol del usuario)
    ↓
Controller (recibe parametros, delega)
    ↓
Service (ejecuta logica de negocio)
    ↓
TypeORM Repository (consulta PostgreSQL)
    ↓
[LoggingInterceptor / HttpLoggingInterceptor] (registro)
    ↓
[AllExceptionsFilter] (manejo de errores)
    ↓
Response HTTP
```

---

## Configuracion del Servidor

- **Prefijo global:** `api/v1` (configurable via `API_PREFIX` env).
- **CORS:** Acepta origenes configurables via `CORS_ORIGIN`; por defecto localhost 3000, 3001, 5173, 5174.
- **Rate limiting:** TTL y limite configurables via `THROTTLE_TTL` y `THROTTLE_LIMIT`.
- **Sincronizacion DB:** `synchronize: true` si `DB_SYNCHRONIZE=true` o `NODE_ENV=development`.

---

## Logging

Winston con archivos rotativos por tipo:

| Archivo | Retencion | Contenido |
|---|---|---|
| combined | 14 dias | Todos los logs |
| error | 30 dias | Solo errores |
| http | 7 dias | Requests HTTP |
| security | 90 dias | Accesos, tokens invalidos |
| business | 90 dias | Eventos de negocio (ordenes, pagos, cupones) |

---

## Seed de Datos Iniciales

**`npm run seed`** crea:
- Roles: `client`, `admin`, `superadmin`
- Usuario superadmin (email y password desde variables de entorno)
- 10 colores: Negro, Marron, Camel, Beige, Rojo vino, Verde oliva, Azul marino, Blanco, Taupe, Caramelo
- 4 categorias: Carteras, Bolsos, Billeteras, Accesorios
- 12 caracteristicas: Ancho, Alto, Profundidad, Material, Tipo de forro, Compartimentos, etc.
- 8 productos con 3-4 variantes cada uno (Cartera Aurora, Bolso Valentina, Tote Isabella, etc.)
