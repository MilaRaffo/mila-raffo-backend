# Quick Start Guide - Mila Raffo Backend

## Prerequisites Checklist
- [ ] Node.js 18+ installed
- [ ] PostgreSQL 14+ installed and running
- [ ] Git installed

## Installation Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment Variables
```bash
cp .env.example .env
```

Edit `.env` file with your settings:
```env
# Required changes:
DB_PASSWORD=your_postgres_password
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
```

### 3. Create Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE mila_raffo_store;

# Exit psql
\q
```

### 4. Run the Application
```bash
# Development mode
npm run start:dev
```

The server will start on `http://localhost:3000`

### 5. Access API Documentation
Open your browser and navigate to:
```
http://localhost:3000/api/docs
```

## First Steps

### Create an Admin User
Use the Swagger UI or curl to register:

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin",
    "lastName": "User",
    "email": "admin@milaraffo.com",
    "password": "Admin123!",
    "role": "ADMIN"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@milaraffo.com",
    "password": "Admin123!"
  }'
```

Save the `accessToken` from the response.

### Test Protected Endpoint
```bash
curl http://localhost:3000/api/v1/products \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Common Issues

### Database Connection Error
- Verify PostgreSQL is running: `pg_isready`
- Check credentials in `.env`
- Ensure database exists: `psql -U postgres -l`

### Port Already in Use
Change the PORT in `.env`:
```env
PORT=3001
```

### Module Not Found
Clear node_modules and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

1. ✅ Create units (cm, kg, L)
2. ✅ Create characteristics (weight, size, color)
3. ✅ Create categories (handbags, wallets, belts)
4. ✅ Create leather types
5. ✅ Create products with categories and characteristics
6. ✅ Create product variants with SKUs
7. ✅ Upload images for variants
8. ✅ Associate leathers with variants

## Development Commands

```bash
# Watch mode
npm run start:dev

# Build
npm run build

# Production mode
npm run start:prod

# Run tests
npm run test

# Format code
npm run format

# Lint code
npm run lint
```

## Useful Queries

### Check Database Schema
```sql
-- List all tables
\dt

-- Describe table structure
\d users
\d products
\d variants

-- Count records
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM users;
```

## Support

Check the main README.md for detailed documentation or visit:
- Swagger UI: http://localhost:3000/api/docs
- NestJS Docs: https://docs.nestjs.com
