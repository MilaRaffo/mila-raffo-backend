# Configuración de AWS S3 para Imágenes

Este servicio utiliza AWS S3 para el almacenamiento de imágenes. A continuación se detallan los pasos para configurarlo.

## Variables de Entorno

Agrega las siguientes variables de entorno a tu archivo `.env`:

```env
# AWS S3
AWS_S3_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
```

## Crear un Bucket en AWS S3

1. Accede a la consola de AWS S3
2. Crea un nuevo bucket
3. Configura los permisos del bucket:
   - Desactiva "Block all public access" si quieres que las imágenes sean públicas
   - O configura una política de bucket específica

## Configurar IAM User/Role

Crea un usuario IAM o rol con los siguientes permisos mínimos:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name/*",
        "arn:aws:s3:::your-bucket-name"
      ]
    }
  ]
}
```

## Configurar CORS (Opcional)

Si necesitas acceder a las imágenes desde un dominio diferente, configura CORS en tu bucket:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

## Uso de la API

### Subir una imagen

```bash
curl -X POST http://localhost:3000/api/v1/images/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "alt=Description of image" \
  -F "variantId=uuid-here"
```

### Respuesta

```json
{
  "id": "uuid",
  "url": "https://your-bucket.s3.us-east-1.amazonaws.com/images/timestamp-random.jpg",
  "alt": "Description of image",
  "variantId": "uuid-here",
  "createdAt": "2026-01-04T...",
  "updatedAt": "2026-01-04T..."
}
```

## Características

- ✅ Subida directa a AWS S3
- ✅ Generación automática de nombres de archivo únicos
- ✅ URLs públicas para acceso directo
- ✅ Eliminación automática de archivos al borrar registros
- ✅ Manejo de errores robusto
- ✅ Content-Type automático basado en el archivo

## Notas de Seguridad

- Las imágenes se suben con ACL `public-read` por defecto
- Si necesitas imágenes privadas, modifica el código en `images.service.ts`
- Para URLs firmadas (signed URLs), considera implementar un endpoint adicional
- Mantén tus credenciales de AWS seguras y nunca las commits en el repositorio
