# API Usage Examples

This document provides practical examples of using the Mila Raffo Store API.

## Table of Contents
1. [Authentication](#authentication)
2. [Roles](#roles)
3. [Users](#users)
4. [Characteristics](#characteristics)
5. [Categories](#categories)
6. [Leathers](#leathers)
7. [Products](#products)
8. [Variants](#variants)
9. [Images](#images)

---

## Authentication

### Register a New User
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "Password123!",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid-here",
    "email": "john@example.com",
    "name": "John",
    "lastName": "Doe",
    "role": {
      "id": "role-uuid",
      "name": "client"
    }
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Password123!"
}
```

### Admin Login
```bash
POST /api/v1/auth/admin/login
Content-Type: application/json

{
  "email": "admin@milaraffo.com",
  "password": "AdminPassword123!"
}
```

**Note:** This endpoint only allows login for users with ADMIN or SUPERADMIN roles.

### Logout
```bash
POST /api/v1/auth/logout
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "refreshToken": "your-refresh-token-here"
}
```

**Response:**
```json
{
  "message": "Logout successful"
}
```

**Note:** Both access and refresh tokens will be added to the blacklist and cannot be reused.

### Refresh Token
```bash
POST /api/v1/auth/refresh
Authorization: Bearer YOUR_REFRESH_TOKEN
Content-Type: application/json

{
  "refresh_token": "your-refresh-token-here"
}
```

**Response:**
```json
{
  "access_token": "new-jwt-token-here"
}
```

---

## Roles

**Note:** All role endpoints require SUPERADMIN access.

### Get All Roles
```bash
GET /api/v1/roles
Authorization: Bearer SUPERADMIN_ACCESS_TOKEN
```

**Response:**
```json
[
  {
    "id": "uuid-1",
    "name": "client",
    "description": "Standard client with basic access",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  {
    "id": "uuid-2",
    "name": "admin",
    "description": "Administrator with product and user management",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  {
    "id": "uuid-3",
    "name": "superadmin",
    "description": "Super administrator with full system access",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Get Role by ID
```bash
GET /api/v1/roles/{roleId}
Authorization: Bearer SUPERADMIN_ACCESS_TOKEN
```

### Create Role
```bash
POST /api/v1/roles
Authorization: Bearer SUPERADMIN_ACCESS_TOKEN
Content-Type: application/json

{
  "name": "manager",
  "description": "Store manager with extended permissions"
}
```

### Update Role
```bash
PATCH /api/v1/roles/{roleId}
Authorization: Bearer SUPERADMIN_ACCESS_TOKEN
Content-Type: application/json

{
  "description": "Updated role description"
}
```

### Delete Role
```bash
DELETE /api/v1/roles/{roleId}
Authorization: Bearer SUPERADMIN_ACCESS_TOKEN
```

**Note:** Cannot delete a role that has associated users.
```

---

## Users

### Get All Users (Paginated)
```bash
GET /api/v1/users?limit=10&offset=0
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Get User by ID
```bash
GET /api/v1/users/1
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Update User
```bash
PATCH /api/v1/users/1
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "name": "John Updated",
  "phone": "+9876543210"
}
```

---

## Characteristics

### Create Characteristic (Admin Only)
```bash
POST /api/v1/characteristics
Authorization: Bearer ADMIN_ACCESS_TOKEN
Content-Type: application/json

{
  "name": "Width",
  "dataType": "number",
  "unit": "cm"
}
```

### Create Characteristic without Unit
```bash
POST /api/v1/characteristics
Authorization: Bearer ADMIN_ACCESS_TOKEN
Content-Type: application/json

{
  "name": "Color",
  "dataType": "text"
}
```

### Get All Characteristics
```bash
GET /api/v1/characteristics?limit=20&offset=0
```

---

## Categories

### Create Root Category
```bash
POST /api/v1/categories
Authorization: Bearer ADMIN_ACCESS_TOKEN
Content-Type: application/json

{
  "name": "Handbags",
  "slug": "handbags",
  "description": "Premium leather handbags",
  "active": true
}
```

### Create Subcategory
```bash
POST /api/v1/categories
Authorization: Bearer ADMIN_ACCESS_TOKEN
Content-Type: application/json

{
  "name": "Tote Bags",
  "slug": "tote-bags",
  "description": "Large tote bags for everyday use",
  "parentId": 1,
  "active": true
}
```

### Get Category Tree
```bash
GET /api/v1/categories/tree
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Handbags",
    "slug": "handbags",
    "description": "Premium leather handbags",
    "parentId": null,
    "active": true,
    "children": [
      {
        "id": 2,
        "name": "Tote Bags",
        "slug": "tote-bags",
        "parentId": 1,
        "active": true,
        "children": []
      }
    ]
  }
]
```

### Get Products by Category
```bash
GET /api/v1/categories/1/products
```

---

## Leathers

### Create Leather Type (Admin Only)
```bash
POST /api/v1/leathers
Authorization: Bearer ADMIN_ACCESS_TOKEN
Content-Type: application/json

{
  "name": "Italian Napa Leather",
  "code": "NAPA-001"
}
```

### Create Leather with Image
```bash
POST /api/v1/leathers
Authorization: Bearer ADMIN_ACCESS_TOKEN
Content-Type: application/json

{
  "name": "Vegetable Tanned Leather",
  "code": "VEG-001",
  "imageId": 5
}
```

### Get All Leathers
```bash
GET /api/v1/leathers?limit=10&offset=0
```

---

## Products

### Create Product with Categories and Characteristics
```bash
POST /api/v1/products
Authorization: Bearer ADMIN_ACCESS_TOKEN
Content-Type: application/json

{
  "name": "Classic Leather Tote Bag",
  "description": "Handcrafted Italian leather tote bag with brass hardware",
  "basePrice": 299.99,
  "available": true,
  "categoryIds": [1, 2],
  "characteristics": [
    {
      "characteristicId": 1,
      "value": "35"
    },
    {
      "characteristicId": 2,
      "value": "Black"
    }
  ]
}
```

### Get All Products
```bash
GET /api/v1/products?limit=10&offset=0
```

**Response includes relationships:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Classic Leather Tote Bag",
      "description": "Handcrafted Italian leather tote bag...",
      "basePrice": "299.99",
      "available": true,
      "productCategories": [
        {
          "categoryId": 1,
          "category": {
            "id": 1,
            "name": "Handbags",
            "slug": "handbags"
          }
        }
      ],
      "productCharacteristics": [
        {
          "characteristicId": 1,
          "value": "35",
          "characteristic": {
            "id": 1,
            "name": "Width",
            "dataType": "number",
            "unit":  "cm"
          }
        }
      ]
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

### Get Product Variants
```bash
GET /api/v1/products/1/variants
```

### Get Product Characteristics
```bash
GET /api/v1/products/1/characteristics
```

### Update Product
```bash
PATCH /api/v1/products/1
Authorization: Bearer ADMIN_ACCESS_TOKEN
Content-Type: application/json

{
  "basePrice": 279.99,
  "available": true
}
```

---

## Variants

### Create Product Variant
```bash
POST /api/v1/variants
Authorization: Bearer ADMIN_ACCESS_TOKEN
Content-Type: application/json

{
  "productId": 1,
  "sku": "TOTE-BLK-001",
  "price": 299.99,
  "leatherIds": [1, 2]
}
```

### Get All Variants
```bash
GET /api/v1/variants?limit=10&offset=0
```

### Add Leathers to Variant
```bash
POST /api/v1/variants/1/leathers
Authorization: Bearer ADMIN_ACCESS_TOKEN
Content-Type: application/json

{
  "leatherIds": [3, 4]
}
```

### Remove Leather from Variant
```bash
DELETE /api/v1/variants/1/leathers/3
Authorization: Bearer ADMIN_ACCESS_TOKEN
```

### Update Variant
```bash
PATCH /api/v1/variants/1
Authorization: Bearer ADMIN_ACCESS_TOKEN
Content-Type: application/json

{
  "price": 279.99,
  "sku": "TOTE-BLK-002"
}
```

---

## Images

### Create Image Record
```bash
POST /api/v1/images
Authorization: Bearer ADMIN_ACCESS_TOKEN
Content-Type: application/json

{
  "variantId": 1,
  "url": "https://example.com/images/product1.jpg",
  "alt": "Black leather tote bag front view"
}
```

### Upload Image File
```bash
POST /api/v1/images/upload
Authorization: Bearer ADMIN_ACCESS_TOKEN
Content-Type: multipart/form-data

file: [binary image data]
variantId: 1
alt: "Product image"
```

**Using curl:**
```bash
curl -X POST http://localhost:3000/api/v1/images/upload \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "variantId=1" \
  -F "alt=Product front view"
```

### Get Images by Variant
```bash
GET /api/v1/images/variant/1
```

### Get All Images
```bash
GET /api/v1/images?limit=20&offset=0
```

---

## Complete Workflow Example

Here's a complete example of creating a product from scratch:

### Step 2: Create Characteristics
```bash
POST /api/v1/characteristics
{
  "name": "Width",
  "dataType": "number",
  "unit": "cm"
}

POST /api/v1/characteristics
{
  "name": "Color",
  "dataType": "text"
}
```

### Step 3: Create Category
```bash
POST /api/v1/categories
{
  "name": "Handbags",
  "slug": "handbags",
  "description": "Premium leather handbags",
  "active": true
}
```

### Step 4: Create Leather Types
```bash
POST /api/v1/leathers
{
  "name": "Italian Napa",
  "code": "NAPA-001"
}
```

### Step 5: Create Product
```bash
POST /api/v1/products
{
  "name": "Classic Tote",
  "description": "Handcrafted leather tote",
  "basePrice": 299.99,
  "categoryIds": [1],
  "characteristics": [
    { "characteristicId": 1, "value": "35" },
    { "characteristicId": 2, "value": "Black" }
  ]
}
```

### Step 6: Create Variant
```bash
POST /api/v1/variants
{
  "productId": 1,
  "sku": "TOTE-BLK-001",
  "price": 299.99,
  "leatherIds": [1]
}
```

### Step 7: Upload Images
```bash
POST /api/v1/images/upload
file: image.jpg
variantId: 1
alt: "Classic tote front view"
```

---

## Pagination Examples

All list endpoints support pagination:

```bash
# First page (default)
GET /api/v1/products?limit=10&offset=0

# Second page
GET /api/v1/products?limit=10&offset=10

# Large page size
GET /api/v1/products?limit=50&offset=0
```

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": [
    "name should not be empty",
    "price must be a positive number"
  ],
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "User role 'USER' does not have access to this resource"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Product with ID 999 not found"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Email already exists"
}
```

---

## Best Practices

1. **Always include Authorization header** for protected endpoints
2. **Use pagination** to avoid loading too much data
3. **Handle errors gracefully** in your client application
4. **Store tokens securely** (never in localStorage for sensitive apps)
5. **Refresh tokens** before they expire
6. **Validate data** on the client side before sending
7. **Use HTTPS** in production

---

For more information, visit the Swagger documentation at `/api/docs`
