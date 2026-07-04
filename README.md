# Mila Raffo — Backend API

NestJS + PostgreSQL + TypeORM. API REST con prefijo global `/api/v1`.

Swagger disponible en `http://localhost:3000/api/docs` cuando el servidor está corriendo.

También hay archivos generados para herramientas de API:
`docs/openapi.generated.json` para OpenAPI/Swagger y
`docs/insomnia.generated.json` para importar una colección de requests en
Insomnia.

---

## Levantar el proyecto (primera vez)

### 1. Variables de entorno

El archivo `.env` ya está en la raíz. No hay que copiarlo.

### 2. Base de datos y servidor con Podman Compose

```bash
podman-compose -f podman-compose.yml up -d --build
```

Levanta PostgreSQL en `localhost:5432` y el backend en `localhost:3000`. El schema se crea automáticamente al arrancar el backend (`synchronize: true` en desarrollo).

### 3. Dependencias

```bash
npm install
```

### 4. Seed (solo la primera vez)

Crea los roles y el superadmin inicial:

```bash
npm run seed
```

### 5. Servidor

```bash
npm run start:dev
```

El servidor queda en `http://localhost:3000` con hot-reload.

---

## Arranque diario

```bash
podman-compose -f podman-compose.yml up -d   # si el contenedor no está corriendo
npm run start:dev
```

---

## GitHub Actions

El repo tiene un workflow en [ci-cd.yml](.github/workflows/ci-cd.yml) que:

- valida `lint`, `test` y `build` en cada PR contra `main`
- publica la imagen con Podman en GHCR cuando hay un push a `main`

La imagen queda disponible como `ghcr.io/<owner>/<repo>` con tags `latest` y el SHA del commit.

---

## Base de datos y schema

**No hay archivos de migración.** TypeORM sincroniza el schema automáticamente en desarrollo: cada vez que se modifica una entidad `.entity.ts`, los cambios se aplican al arrancar el servidor.

Las entidades están en cada módulo bajo `src/<modulo>/**/*.entity.ts`.

En producción, cambiar `DB_SYNCHRONIZE=false` en `.env` y generar migraciones con TypeORM CLI antes de deployar.

---

## Scripts disponibles

| Comando              | Descripción                                 |
| -------------------- | ------------------------------------------- |
| `npm run start:dev`  | Dev con hot-reload                          |
| `npm run start:prod` | Producción (requiere `npm run build` antes) |
| `npm run build`      | Compila TypeScript a `dist/`                |
| `npm run seed`       | Crea roles y superadmin (solo primera vez)  |

---

## Importar en Insomnia

1. Abrir Insomnia.
2. Ir a `Create > Import from File`.
3. Seleccionar `docs/insomnia.generated.json`.
4. Configurar la variable `base_url` con la URL base del backend, por ejemplo `http://localhost:3000`.
5. Si vas a probar endpoints protegidos, configurar `access_token` con el JWT.

Las rutas del archivo ya incluyen el prefijo global `/api/v1`.

---

## Variables de entorno clave (`.env`)

```env
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=mila_raffo_store
DB_SYNCHRONIZE=true        # false en producción

JWT_SECRET=...
JWT_REFRESH_SECRET=...

CULQI_SECRET_KEY=sk_test_...
# Optional; defaults to https://api.culqi.com/v2
CULQI_API_URL=https://api.culqi.com/v2

SUPERADMIN_EMAIL=superadmin@milaraffo.com
SUPERADMIN_PASSWORD=SuperAdmin123!
```

---

## Estructura de módulos

```
src/
├── auth/          # JWT, refresh tokens, blacklist
├── users/         # Usuarios y perfiles
├── roles/         # CLIENT / ADMIN / SUPERADMIN
├── products/      # Catálogo de productos
├── variants/      # Variantes con SKU
├── categories/    # Árbol de categorías
├── characteristics/
├── leathers/
├── images/        # Subida a AWS S3
├── promotions/
├── coupons/
├── addresses/
├── orders/
├── payments/
└── common/        # Guards, filtros, logger, decorators
```

---

## App mobile

El cliente mobile (Expo) vive en `../mila-raffo-app/`. Se conecta a `http://localhost:3000/api/v1`.
