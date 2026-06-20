import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { LoggerService } from './common/services/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Configure custom logger
  const logger = app.get(LoggerService);
  logger.setContext('Bootstrap');
  app.useLogger(logger);

  logger.log('Starting Mila Raffo Store API...');

  // Global prefix
  app.setGlobalPrefix(process.env.API_PREFIX || 'api/v1');

  // CORS
  const envOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://localhost:5174',
  ];
  const allowedOrigins = envOrigins.length > 0 ? envOrigins : defaultOrigins;

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
  });

  logger.log(`CORS enabled for origins: ${allowedOrigins.join(', ')}`);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Mila Raffo Store API')
    .setDescription('E-commerce API for Mila Raffo store')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication and authorization endpoints')
    .addTag('roles', 'Role management (Superadmin only)')
    .addTag('users', 'User management')
    .addTag('products', 'Product catalog')
    .addTag('variants', 'Product variants')
    .addTag('categories', 'Category hierarchy')
    .addTag('characteristics', 'Product characteristics')
    .addTag('colors', 'Color management')
    .addTag('images', 'Image management')
    .addTag('promotions', 'Promotions and sales')
    .addTag('coupons', 'Discount coupons')
    .addTag('addresses', 'User addresses')
    .addTag('cart', 'Shopping cart')
    .addTag('wishlist', 'Wishlist')
    .addTag('orders', 'Order management')
    .addTag('payments', 'Payment processing')
    .addTag('shipments', 'Shipment tracking')
    .addTag('notifications', 'Push notifications')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Swagger documentation: http://localhost:${port}/api/docs`);
  logger.log(`API prefix: ${process.env.API_PREFIX || 'api/v1'}`);
  logger.log('Application started successfully');
}
bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
