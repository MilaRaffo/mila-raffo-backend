# Mila Raffo Store - Backend API

Complete e-commerce backend built with NestJS for a luxury leather goods store.

## 🚀 Features

### Core E-commerce
- **Authentication & Authorization**: JWT-based authentication with role-based access control (CLIENT/ADMIN/SUPERADMIN)
- **User Management**: Complete user CRUD with secure password hashing and profile management
- **Product Catalog**: Full product management with variants, categories, and characteristics
- **Category Hierarchy**: Nested category tree structure with parent-child relationships
- **Product Variants**: Support for multiple SKUs with availability control and leather types per product
- **Characteristics System**: Flexible product attributes with units (text, number, boolean)
- **Image Management**: AWS S3 integration for image storage
- **Leather Types**: Catalog of leather materials with images

### Promotions & Discounts
- **Promotions System**: Support for percentage, fixed amount, buy X get Y, and free shipping promotions
- **Coupon Codes**: Unique discount codes with usage limits, date ranges, and per-user restrictions
- **Stackable Discounts**: Priority-based promotion system
- **Auto-expiration**: Automatic status updates for expired promotions and coupons

### Order Management
- **Complete Order Flow**: From cart to delivery tracking
- **Order States**: Pending, confirmed, processing, shipped, delivered, cancelled, refunded
- **Address Management**: Separate shipping and billing addresses
- **Order History**: Full order tracking with item details

### Payment Processing
- **Test Payment Mode**: Built-in test payment system for development
- **Gateway Ready**: Prepared for integration with Stripe, PayPal, MercadoPago
- **Payment States**: Pending, processing, completed, failed, refunded
- **Webhook Support**: Endpoint ready for payment gateway callbacks
- **Refund Processing**: Admin-controlled refund system

### User Features
- **Address Book**: Multiple saved addresses with default selection
- **User Profile**: Complete profile with order history and saved addresses
- **Order Tracking**: Real-time order status and delivery updates

### System Features
- **Comprehensive Logging**: Professional Winston-based logging system with multiple categories
  - HTTP request/response logging with timing and user context
  - Security audit logging (login, access control, token validation)
  - Business event logging (orders, payments, coupons)
  - Error logging with stack traces
  - Daily log rotation with automatic cleanup
  - Separate log files by category (HTTP, Security, Business, Error)
  - JSON format for easy analysis and integration with monitoring tools
- **Pagination**: All list endpoints support pagination
- **Soft Deletes**: Safe deletion with recovery capability
- **API Documentation**: Auto-generated Swagger/OpenAPI documentation
- **Validation**: Request validation with class-validator
- **Error Handling**: Global exception filters
- **Rate Limiting**: Protection against brute force attacks
- **Scheduled Tasks**: Automatic cleanup and status updates

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
   - AWS S3 settings (see [S3_SETUP.md](S3_SETUP.md))

4. **Configure AWS S3**
   
   Configure your AWS S3 credentials in `.env`:
   ```env
   AWS_S3_REGION=us-east-1
   AWS_S3_BUCKET=your-bucket-name
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   ```
   
   See [S3_SETUP.md](S3_SETUP.md) for detailed configuration.

5. **Create PostgreSQL database**
   ```sql
   CREATE DATABASE mila_raffo_store;
   ```

6. **Run the application**
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

- **AuthModule**: JWT authentication with access and refresh tokens, token blacklist
- **UsersModule**: User CRUD operations with role-based permissions and profile management
- **RolesModule**: Dynamic role management (CLIENT, ADMIN, SUPERADMIN)
- **ProductsModule**: Complete product management with availability control
- **VariantsModule**: Product variant management with availability and leather types
- **CategoriesModule**: Hierarchical category structure with tree support
- **CharacteristicsModule**: Product attribute definitions with data types
- **LeathersModule**: Leather type catalog with images
- **ImagesModule**: File upload system with variant associations

### E-commerce Modules

- **PromotionsModule**: Sales promotions with various discount types
- **CouponsModule**: Discount coupon system with validation and usage tracking
- **AddressesModule**: User address management with default selection
- **OrdersModule**: Complete order lifecycle management
- **PaymentsModule**: Payment processing with test mode and gateway integration

## 🗄️ Database Schema

### Core Tables
- `users`, `roles`, `products`, `variants`, `categories`, `characteristics`, `leathers`, `images`

### E-commerce Tables
- `promotions`, `coupons`, `coupon_usage`, `addresses`, `orders`, `order_items`, `payments`

### Junction Tables
- `product_categories`, `product_characteristics`, `variant_leathers`, `promotion_products`, `promotion_categories`

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
$ npm run testadmin/login` - Admin login (ADMIN/SUPERADMIN only)
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout and invalidate tokens

### Users
- `GET /users/profile` - Get current user profile with addresses
- `GET /users` - List users (Admin only)
- `PATCH /users/:id` - Update user

### Products & Variants
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

### Promotions & Coupons
- `GET /promotions/active` - Get active promotions
- `POST /promotions` - Create promotion (Admin only)
- `POST /coupons/validate` - Validate coupon code
- `POST /coupons` - Create coupon (Admin only)

### Addresses
- `GET /addresses` - Get user addresses
- `GET /addresses/default` - Get default address
- `POST /addresses` - Create address
- `PATCH /addresses/:id/set-default` - Set as default

### Orders
- `POST /orders` - Create new order
- `GET /orders` - Get user orders
- `GET /orders/:id` - Get order details
- `GET /orders/number/:orderNumber` - Get order by number
- `PATCH /orders/:id/cancel` - Cancel order

### Payments
- `POST /payments` - Create payment for order
- `GET /payments` - Get user payments
- `GET /payments/order/:orderId` - Get payments for order
- `PATCH /payments/:id/refund` - Refund payme
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

## � Documentation

### Essential Guides
- **[S3_SETUP.md](S3_SETUP.md)** - AWS S3 configuration for image storage
- **[ECOMMERCE_GUIDE.md](ECOMMERCE_GUIDE.md)** - Complete e-commerce features guide
- **[LOGGING_GUIDE.md](LOGGING_GUIDE.md)** - Comprehensive logging system documentation
- **[ROLES_GUIDE.md](ROLES_GUIDE.md)** - Role-based access control guide
- **[TOKEN_BLACKLIST_GUIDE.md](TOKEN_BLACKLIST_GUIDE.md)** - Token management guide

### Quick Start Guides
- **[ROLES_QUICKSTART.md](ROLES_QUICKSTART.md)** - Quick setup for role system
- **[TOKEN_BLACKLIST_QUICKSTART.md](TOKEN_BLACKLIST_QUICKSTART.md)** - Quick setup for token blacklist

## 🔒 Security Features

- **Password hashing** with bcrypt (10 rounds)
- **JWT tokens** (access + refresh) with configurable expiration
- **Token blacklist** system for logout and revocation
- **Role-based access control** (CLIENT/ADMIN/SUPERADMIN)
- **Resource-level permissions** with custom guards
- **Input validation** on all endpoints with class-validator
- **Rate limiting** to prevent brute force attacks
- **CORS** configuration for cross-origin requests
- **Soft deletes** for data preservation and audit trails
- **SQL injection protection** via TypeORM parameterized queries
- **XSS protection** through input sanitization
- **Security audit logging** - All authentication and authorization events are logged

## 📊 Project Structure

```
src/
├── auth/              # Authentication & authorization
│   ├── guards/        # JWT, roles, and resource guards
│   ├── services/      # Token blacklist & cleanup
│   └── strategies/    # JWT strategy
├── users/             # User management & profiles
├── roles/             # Dynamic role management
├── products/          # Product catalog
├── variants/          # Product variants
├── categories/        # Category hierarchy
├── characteristics/   # Product attributes
├── leathers/          # Leather types
├── images/            # Image management (S3)
├── promotions/        # Sales promotions system
├── coupons/           # Discount coupons
├── addresses/         # User address management
├── orders/            # Order processing & tracking
├── payments/          # Payment processing
├── common/            # Shared utilities
│   ├── decorators/    # Custom decorators (roles, public, log actions)
│   ├── dto/           # Common DTOs
│   ├── filters/       # Exception filters
│   ├── guards/        # Common guards
│   ├── interceptors/  # HTTP logging, business logging
│   ├── services/      # Logger service
│   └── pipes/         # Validation pipes
├── config/            # Configuration files
└── main.ts            # Application entry point
```

## 📋 Logging

The application uses a professional Winston-based logging system that records:

- **HTTP Requests**: All incoming requests with timing, user info, and responses
- **Security Events**: Login attempts, access denials, token validation
- **Business Events**: Orders, payments, coupon usage, refunds
- **Errors**: Complete error logs with stack traces

Logs are stored in the `logs/` directory with daily rotation:
- `combined-YYYY-MM-DD.log` - All logs (14 days retention)
- `error-YYYY-MM-DD.log` - Errors only (30 days retention)
- `http-YYYY-MM-DD.log` - HTTP requests (7 days retention)
- `security-YYYY-MM-DD.log` - Security events (90 days retention)
- `business-YYYY-MM-DD.log` - Business events (90 days retention)

See [LOGGING_GUIDE.md](LOGGING_GUIDE.md) for complete documentation.

## 🎨 Tech Stack

- NestJS 10.x
- TypeScript 5.x
- PostgreSQL 14+
- TypeORM
- JWT with Passport
- class-validator
- Swagger/OpenAPI
- bcrypt
- Winston (logging)

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

