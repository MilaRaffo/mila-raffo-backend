# Mila Raffo Store - Backend API

Complete e-commerce backend built with NestJS for a luxury leather goods store.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control (ADMIN/USER)
- **User Management**: Complete user CRUD with secure password hashing
- **Product Catalog**: Full product management with variants, categories, and characteristics
- **Category Hierarchy**: Nested category tree structure with parent-child relationships
- **Product Variants**: Support for multiple SKUs, pricing, and leather types per product
- **Characteristics System**: Flexible product attributes with units (text, number, boolean)
- **Image Management**: File upload system with variant associations
- **Leather Types**: Catalog of leather materials with images
- **Pagination**: All list endpoints support pagination
- **Soft Deletes**: Safe deletion with recovery capability
- **API Documentation**: Auto-generated Swagger/OpenAPI documentation
- **Validation**: Request validation with class-validator
- **Error Handling**: Global exception filters
- **Logging**: Request/response logging interceptor

## 📋 Prerequisites

- Node.js >= 18.x
- PostgreSQL >= 14.x
- npm or yarn

## Description

Complete NestJS e-commerce backend with authentication, products, variants, categories, and more.

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mila-raffo-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   - Database credentials
   - JWT secrets
   - Server port
   - CORS settings
   - Upload settings

4. **Create PostgreSQL database**
   ```sql
   CREATE DATABASE mila_raffo_store;
   ```

5. **Run the application**
   ```bash
   # Development mode with hot-reload
   npm run start:dev

   # Production mode
   npm run build
   npm run start:prod
   ```

## 📚 API Documentation

Once the server is running, access the interactive API documentation:

**Swagger UI**: `http://localhost:3000/api/docs`

## 🔐 Authentication

### Register a new user
```bash
POST /api/v1/auth/register
{
  "name": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "Password123!",
  "phone": "+1234567890"
}
```

### Login
```bash
POST /api/v1/auth/login
{
  "email": "john@example.com",
  "password": "Password123!"
}
```

Response includes `accessToken` and `refreshToken`.

### Using protected endpoints
Add the access token to the Authorization header:
```
Authorization: Bearer <your-access-token>
```

## Project setup

```bash
$ npm install
```

## 📦 Module Structure

### Core Modules

- **AuthModule**: JWT authentication with access and refresh tokens
- **UsersModule**: User CRUD operations with role-based permissions
- **ProductsModule**: Complete product management with categories and characteristics
- **VariantsModule**: Product variant management with SKUs and leather types
- **CategoriesModule**: Hierarchical category structure with tree support
- **CharacteristicsModule**: Product attribute definitions with data types
- **UnitsModule**: Measurement units (cm, kg, L, etc.)
- **LeathersModule**: Leather type catalog with images
- **ImagesModule**: File upload system with variant associations

## 🗄️ Database Schema

### Core Tables
- `users`, `products`, `variants`, `categories`, `characteristics`, `units`, `leathers`, `images`

### Junction Tables
- `product_categories`, `product_characteristics`, `variant_leathers`

## 🔑 Key Environment Variables

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mila_raffo_store
JWT_SECRET=your-secret-key
JWT_EXPIRATION=15m
CORS_ORIGIN=http://localhost:4200
```

See `.env.example` for complete configuration.

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## 🎯 Main API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh access token

### Products
- `GET /products` - List products (paginated)
- `GET /products/:id` - Get product details
- `GET /products/:id/variants` - Get product variants
- `POST /products` - Create product (Admin only)
- `PATCH /products/:id` - Update product (Admin only)
- `DELETE /products/:id` - Delete product (Admin only)

### Categories
- `GET /categories` - List categories
- `GET /categories/tree` - Get category tree
- `GET /categories/:id/products` - Get products by category

### Variants
- `GET /variants` - List variants
- `POST /variants` - Create variant (Admin only)
- `POST /variants/:id/leathers` - Add leathers to variant (Admin only)

See Swagger documentation for complete API reference.

## 🔒 Security Features

- Password hashing with bcrypt
- JWT tokens (access + refresh)
- Role-based access control (ADMIN/USER)
- Input validation on all endpoints
- Rate limiting
- CORS configuration
- Soft deletes for data preservation

## 📊 Project Structure

```
src/
├── auth/              # Authentication & authorization
├── users/             # User management
├── products/          # Product catalog
├── variants/          # Product variants
├── categories/        # Category hierarchy
├── characteristics/   # Product attributes
├── units/             # Measurement units
├── leathers/          # Leather types
├── images/            # Image management
├── common/            # Shared utilities
├── config/            # Configuration files
└── main.ts            # Application entry point
```

## 🎨 Tech Stack

- NestJS 10.x
- TypeScript 5.x
- PostgreSQL 14+
- TypeORM
- JWT with Passport
- class-validator
- Swagger/OpenAPI
- bcrypt

## Deployment

For production deployment:

```bash
npm run build
npm run start:prod
```

Configure production environment variables and ensure PostgreSQL is accessible.

## 📄 License

This project is licensed under the MIT License.

## 🤝 Support

For questions and support about NestJS, visit the [NestJS Documentation](https://docs.nestjs.com) or [Discord channel](https://discord.gg/G7Qnnhy).

---

**Built with ❤️ using NestJS**

