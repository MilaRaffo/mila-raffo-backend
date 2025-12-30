# Docker Setup - Mila Raffo Backend

## Requisitos Previos

- Docker instalado
- Docker Compose instalado

## Configuración

1. Crea un archivo `.env` basado en `.env.example`:
   ```bash
   cp .env.example .env
   ```

2. Edita el archivo `.env` con tus valores:
   - Cambia `JWT_SECRET` y `JWT_REFRESH_SECRET` por valores seguros
   - Ajusta las credenciales de la base de datos si es necesario

## Comandos Disponibles

### Iniciar la aplicación

```bash
# Construir e iniciar todos los servicios (backend + PostgreSQL)
docker-compose up -d

# Ver logs
docker-compose logs -f

# Ver logs solo del backend
docker-compose logs -f backend
```

### Detener la aplicación

```bash
# Detener servicios
docker-compose stop

# Detener y eliminar contenedores
docker-compose down

# Detener y eliminar contenedores + volúmenes (¡elimina la base de datos!)
docker-compose down -v
```

### Reconstruir la aplicación

```bash
# Reconstruir después de cambios en el código
docker-compose up -d --build

# Forzar reconstrucción completa
docker-compose build --no-cache
docker-compose up -d
```

### Ejecutar comandos dentro del contenedor

```bash
# Acceder al contenedor del backend
docker-compose exec backend sh

# Ejecutar migraciones (si las tienes configuradas)
docker-compose exec backend npm run migration:run

# Ver logs de PostgreSQL
docker-compose logs -f postgres
```

## Estructura de Servicios

- **backend**: Aplicación NestJS en el puerto 3000
- **postgres**: Base de datos PostgreSQL en el puerto 5432

## Variables de Entorno

Todas las variables de entorno se configuran en el archivo `.env`:

- `PORT`: Puerto de la aplicación (default: 3000)
- `DB_HOST`: Host de la base de datos
- `DB_PORT`: Puerto de PostgreSQL (default: 5432)
- `DB_USERNAME`: Usuario de PostgreSQL
- `DB_PASSWORD`: Contraseña de PostgreSQL
- `DB_DATABASE`: Nombre de la base de datos
- `JWT_SECRET`: Secreto para tokens JWT
- `JWT_REFRESH_SECRET`: Secreto para refresh tokens
- `JWT_EXPIRATION`: Tiempo de expiración del token (default: 1h)
- `JWT_REFRESH_EXPIRATION`: Tiempo de expiración del refresh token (default: 7d)

## Acceso a la Aplicación

Una vez iniciados los servicios:

- **API**: http://localhost:3000
- **Swagger/OpenAPI**: http://localhost:3000/api (si está configurado)
- **PostgreSQL**: localhost:5432

## Desarrollo Local vs Docker

### Para desarrollo local (sin Docker):
```bash
npm run start:dev
```

### Para ejecutar con Docker:
```bash
docker-compose up -d
```

## Solución de Problemas

### El contenedor no inicia
```bash
# Ver logs detallados
docker-compose logs backend

# Verificar el estado
docker-compose ps
```

### Problemas de conexión a la base de datos
- Asegúrate de que `DB_HOST=postgres` en el archivo `.env` cuando uses Docker Compose
- Para desarrollo local, usa `DB_HOST=localhost`

### Limpiar todo y empezar de nuevo
```bash
docker-compose down -v
docker-compose up -d --build
```

## Producción

Para producción, considera:

1. Usar un archivo `.env.production` con valores seguros
2. Configurar volúmenes persistentes para uploads
3. Implementar backups de la base de datos
4. Usar secretos de Docker en lugar de variables de entorno
5. Configurar un reverse proxy (nginx) si es necesario
