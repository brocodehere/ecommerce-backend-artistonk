# E-commerce Backend API

Backend Developer Technical Task — a REST API for user authentication, product management, and order processing with safe concurrent stock handling.

**Base URL:** `http://localhost:3000` (configurable via `PORT`)

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Features](#features)
4. [Project Structure](#project-structure)
5. [Prerequisites](#prerequisites)
6. [Environment Variables](#environment-variables)
7. [PostgreSQL Database Setup](#postgresql-database-setup)
8. [Installation & Run Instructions](#installation--run-instructions)
9. [Authentication & Authorization](#authentication--authorization)
10. [Authentication APIs](#authentication-apis)
11. [Product APIs](#product-apis)
12. [Product Search, Filters & Pagination](#product-search-filters--pagination)
13. [Order APIs](#order-apis)
14. [Request & Response Examples](#request--response-examples)
15. [HTTP Status Codes & Error Handling](#http-status-codes--error-handling)
16. [Stock Management & Order Validation](#stock-management--order-validation)
17. [Concurrent Order Handling](#concurrent-order-handling)
18. [Postman Collection](#postman-collection)
19. [Known Limitations](#known-limitations)
20. [AI Usage](#ai-usage)

---



## Project Overview

This project is a modular Node.js backend for a simple e-commerce flow:

- Users **register** and **login** to receive a JWT.
- **Products** can be created, listed (with search/filters/pagination), updated, and deleted.
- Authenticated users can **place orders**; stock is validated and reduced atomically inside a database transaction.

The codebase uses Express route modules, controllers, middleware, validators, and a PostgreSQL migration script. There is no separate service layer — business logic lives in controllers.

---



## Tech Stack


| Technology                       | Purpose                                                    |
| -------------------------------- | ---------------------------------------------------------- |
| Node.js                          | Runtime                                                    |
| Express.js                       | HTTP server and routing                                    |
| PostgreSQL                       | Persistent storage                                         |
| `pg`                             | PostgreSQL client (connection pool, parameterized queries) |
| JSON Web Tokens (`jsonwebtoken`) | Stateless authentication                                   |
| bcrypt                           | Password hashing (10 salt rounds)                          |
| dotenv                           | Environment variable loading                               |


---



## Features

- **Auth:** Register, login, JWT middleware, bcrypt hashing, input validation
- **Products:** Full CRUD with fields `name`, `description`, `price`, `stockQuantity`, `category`, `createdAt`
- **Product listing:** Name search, category filter, in-stock filter, pagination
- **Orders:** Create and view orders (own orders only), product existence checks, stock validation, transactional stock reduction
- **Concurrency safety:** Row-level locking and conditional stock updates prevent overselling
- **Engineering:** Centralized error handling, validation middleware, environment-based config, SQL migrations with indexes, basic security headers

---



## Project Structure

```
├── migrations/
│   ├── 001_initial_schema.sql   # Tables: users, products, orders, order_items + indexes
│   └── migrate.js               # Runs all .sql files in order
├── postman/
│   └── Ecommerce-API.postman_collection.json
├── src/
│   ├── config/
│   │   └── database.js          # PostgreSQL pool (DATABASE_URL or DB_* vars)
│   ├── controllers/
│   │   ├── authController.js    # Register, login
│   │   ├── productController.js # Product CRUD
│   │   └── orderController.js   # Order create/list (with transactions)
│   ├── middleware/
│   │   ├── auth.js              # JWT Bearer token verification
│   │   ├── errorHandler.js      # Centralized error responses
│   │   ├── notFound.js          # 404 for unknown routes
│   │   ├── validateId.js        # Numeric :id param validation
│   │   └── validation.js        # Request body / query validators
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── orderRoutes.js
│   │   └── index.js             # Mounts /auth, /products, /orders, /health
│   ├── utils/
│   │   ├── errors.js            # createError(status, message)
│   │   ├── formatters.js        # DB rows → camelCase API responses
│   │   ├── jwt.js               # sign / verify tokens
│   │   └── validators.js        # Input validation rules
│   ├── app.js                   # Express app setup
│   └── server.js                # Startup + DB connectivity check
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---



## Prerequisites

- **Node.js** 18 or higher
- **npm** (included with Node.js)
- A **PostgreSQL** database — [Neon](https://neon.tech) is recommended (free tier, cloud-hosted)/ use local db
- **Postman** for importing and testing the API collection

---



## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
# Linux / macOS
cp .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env
```



### Variables


| Variable         | Required | Default     | Description                                          |
| ---------------- | -------- | ----------- | ---------------------------------------------------- |
| `PORT`           | No       | `3000`      | HTTP server port                                     |
| `NODE_ENV`       | No       | —           | `development` exposes error details in 500 responses |
| `DATABASE_URL`   | Yes*     | —           | Neon PostgreSQL connection string (recommended)      |
| `DB_HOST`        | Yes*     | `localhost` | Local PostgreSQL host                                |
| `DB_PORT`        | No       | `5432`      | Local PostgreSQL port                                |
| `DB_NAME`        | No       | `ecommerce` | Local database name                                  |
| `DB_USER`        | No       | `postgres`  | Local database user                                  |
| `DB_PASSWORD`    | Yes*     | —           | Local database password                              |
| `DB_SSL`         | No       | SSL enabled | Set to `false` for local PostgreSQL without SSL      |
| `JWT_SECRET`     | **Yes**  | —           | Secret for signing JWTs                              |
| `JWT_EXPIRES_IN` | No       | `7d`        | Token expiry (e.g. `1h`, `7d`)                       |


 Provide **either** `DATABASE_URL` **or** `DB_PASSWORD` with the individual `DB_`* variables. The server exits on startup if neither is configured.

### Example `.env` (Neon)

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=your_long_random_secret_key
JWT_EXPIRES_IN=7d
```

See `.env.example` for the full template including local PostgreSQL options.

---



## PostgreSQL Database Setup



### 1. Create a Neon database

1. Sign up at [neon.tech](https://neon.tech) and create a project.
2. Open **Connection Details** and copy the connection string.
3. Paste it as `DATABASE_URL` in your `.env` file.



### 2. Run migrations

```bash
npm run migrate
```

This executes `migrations/001_initial_schema.sql`, which creates:


| Table         | Purpose                                          |
| ------------- | ------------------------------------------------ |
| `users`       | Registered accounts (`email`, hashed `password`) |
| `products`    | Product catalog                                  |
| `orders`      | Order headers linked to `users`                  |
| `order_items` | Line items per order                             |


**Indexes created:** `users(email)`, `products(name, category, stock_quantity, name+category)`, `orders(user_id, status, created_at)`, `order_items(order_id, product_id)`.

### 3. Verify connectivity

```bash
npm start
```

On success you should see `Database connected successfully` and `Server running on http://localhost:3000`.

---



## Installation & Run Instructions

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (see above)
cp .env.example .env   # then edit .env

# 3. Run migrations
npm run migrate

# 4. Start the server
npm start
```


|     |
| --- |


---



## Authentication & Authorization

JWT is sent via the `Authorization` header:

```
Authorization: Bearer <token>
```


| Endpoint               | Auth Required | Notes                                                      |
| ---------------------- | ------------- | ---------------------------------------------------------- |
| `GET /health`          | No            | Health check                                               |
| `POST /auth/register`  | No            | Returns JWT on success                                     |
| `POST /auth/login`     | No            | Returns JWT on success                                     |
| `POST /products`       | No            | Public                                                     |
| `GET /products`        | No            | Public                                                     |
| `GET /products/:id`    | No            | Public                                                     |
| `PATCH /products/:id`  | No            | Public                                                     |
| `DELETE /products/:id` | No            | Public                                                     |
| `POST /orders`         | **Yes**       | Uses `req.userId` from JWT                                 |
| `GET /orders`          | **Yes**       | Returns only the authenticated user's orders               |
| `GET /orders/:id`      | **Yes**       | Returns order only if it belongs to the authenticated user |


Passwords are never included in API responses.

---



## Authentication APIs



### POST `/auth/register`

Register a new user.

**Request body:**


| Field      | Type   | Rules                |
| ---------- | ------ | -------------------- |
| `email`    | string | Valid email format   |
| `password` | string | Minimum 6 characters |


**Success:** `201 Created`

**Errors:** `400` validation, `409` duplicate email

---



### POST `/auth/login`

Authenticate an existing user.

**Request body:** Same as register.

**Success:** `200 OK`

**Errors:** `400` validation, `401` invalid credentials

---



## Product APIs

All product responses use camelCase. Required fields on create: `name`, `price`, `stockQuantity`. Optional: `description`, `category`.

### POST `/products`

Create a product.


| Field           | Type   | Required | Rules       |
| --------------- | ------ | -------- | ----------- |
| `name`          | string | Yes      | Non-empty   |
| `description`   | string | No       | —           |
| `price`         | number | Yes      | Must be > 0 |
| `stockQuantity` | number | Yes      | Must be ≥ 0 |
| `category`      | string | No       | —           |


**Success:** `201 Created`

---



### GET `/products`

List products with optional filters and pagination. See [Product Search, Filters & Pagination](#product-search-filters--pagination).

**Success:** `200 OK`

---



### GET `/products/:id`

Get a single product by numeric ID.

**Success:** `200 OK` — **Errors:** `400` invalid ID, `404` not found

---



### PATCH `/products/:id`

Partial update. At least one field must be provided.

Updatable fields: `name`, `description`, `price`, `stockQuantity`, `category` (same validation rules as create where applicable).

**Success:** `200 OK` — **Errors:** `400` validation, `404` not found

---



### DELETE `/products/:id`

Delete a product by ID.

**Success:** `200 OK` — **Errors:** `400` invalid ID, `404` not found

> **Note:** Deleting a product that appears in past `order_items` may fail with a foreign key error (`400`) if orders reference it.

---



## Product Search, Filters & Pagination

**GET** `/products` supports these query parameters:


| Parameter  | Type   | Default | Description                                                     |
| ---------- | ------ | ------- | --------------------------------------------------------------- |
| `search`   | string | —       | Case-insensitive partial match on `name` (`ILIKE`)              |
| `category` | string | —       | Exact match on `category`                                       |
| `inStock`  | string | —       | `"true"` → `stockQuantity > 0`; `"false"` → `stockQuantity = 0` |
| `page`     | number | `1`     | Page number (must be > 0)                                       |
| `limit`    | number | `10`    | Items per page (must be > 0)                                    |


Results are ordered by `createdAt` descending.

**Example:**

```
GET /products?search=mouse&category=Electronics&inStock=true&page=1&limit=10
```

**Response shape:**

```json
{
  "products": [ { "id": 1, "name": "...", "price": 29.99, "stockQuantity": 50, "category": "Electronics", "createdAt": "..." } ],
  "pagination": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
}
```

---



## Order APIs

All order endpoints require a valid JWT.

### POST `/orders`

Create an order and reduce product stock.

**Request body:**

```json
{
  "items": [
    { "productId": 1, "quantity": 2 }
  ]
}
```


| Field               | Rules                    |
| ------------------- | ------------------------ |
| `items`             | Required non-empty array |
| `items[].productId` | Required                 |
| `items[].quantity`  | Required positive number |


**Success:** `201 Created` — order `status` is set to `"confirmed"`.

**Errors:** `400` validation / insufficient stock, `404` product not found, `401` missing or invalid token

---



### GET `/orders`

List all orders for the authenticated user (newest first), each including its line items.

**Success:** `200 OK`

---



### GET `/orders/:id`

Get a single order by ID. Only returns orders belonging to the authenticated user.

**Success:** `200 OK` — **Errors:** `400` invalid ID, `404` not found (or not owned by user), `401` unauthorized

---



## Request & Response Examples



### Register

**Request:**

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

**Response (**`201`**):**

```json
{
  "message": "User registered successfully",
  "user": { "id": 1, "email": "user@example.com", "createdAt": "2026-09-10T00:00:00.000Z" },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```



### Login

**Response (**`200`**):**

```json
{
  "message": "Login successful",
  "user": { "id": 1, "email": "user@example.com" },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```



### Create Product

**Request:**

```bash
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Wireless Mouse","description":"Ergonomic mouse","price":29.99,"stockQuantity":10,"category":"Electronics"}'
```

**Response (**`201`**):**

```json
{
  "message": "Product created successfully",
  "product": {
    "id": 1,
    "name": "Wireless Mouse",
    "description": "Ergonomic mouse",
    "price": 29.99,
    "stockQuantity": 10,
    "category": "Electronics",
    "createdAt": "2026-09-10T00:00:00.000Z"
  }
}
```



### Create Order

**Request:**

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"items":[{"productId":1,"quantity":2}]}'
```

**Response (**`201`**):**

```json
{
  "message": "Order created successfully",
  "order": {
    "id": 1,
    "userId": 1,
    "totalAmount": 59.98,
    "status": "confirmed",
    "createdAt": "2026-09-10T00:00:00.000Z",
    "items": [
      {
        "id": 1,
        "productId": 1,
        "productName": "Wireless Mouse",
        "quantity": 2,
        "priceAtOrder": 29.99
      }
    ]
  }
}
```



### Validation Error Example

**Response (**`400`**):**

```json
{
  "error": "Validation Error",
  "message": "Invalid input data",
  "details": [
    { "field": "email", "message": "Valid email is required" }
  ]
}
```

---



## HTTP Status Codes & Error Handling


| Code  | When                                                                       |
| ----- | -------------------------------------------------------------------------- |
| `200` | Successful GET, PATCH, DELETE                                              |
| `201` | Successful POST (register, create product, create order)                   |
| `400` | Validation failure, bad request, insufficient stock, foreign key violation |
| `401` | Missing/invalid/expired JWT, invalid login credentials                     |
| `404` | Route, product, or order not found                                         |
| `409` | Duplicate email on registration                                            |
| `500` | Unhandled server or database errors                                        |


All errors follow a consistent JSON shape:

```json
{
  "error": "Error Category",
  "message": "Human-readable description",
  "details": []
}
```

`details` appears only for validation errors. In production (`NODE_ENV` ≠ `development`), generic 500 messages hide internal error text.

Errors are handled centrally in `src/middleware/errorHandler.js`. Unknown routes return `404` via `src/middleware/notFound.js`.

---



## Stock Management & Order Validation

When an order is created, the following checks run **inside a single PostgreSQL transaction**:

1. **Product existence** — Each `productId` is looked up; missing products return `404`.
2. **Stock availability** — Requested `quantity` is compared against current `stock_quantity`.
3. **Atomic stock reduction** — Stock is decremented with a conditional update:
  ```sql
   UPDATE products
   SET stock_quantity = stock_quantity - $1
   WHERE id = $2 AND stock_quantity >= $1
   RETURNING stock_quantity;
  ```
   If zero rows are updated, the order fails with `400 Insufficient stock`.
4. **Order persistence** — An `orders` row and corresponding `order_items` rows are inserted with the price captured at order time (`price_at_order`).
5. **Rollback on failure** — Any error triggers `ROLLBACK`, restoring stock changes from that transaction.

Negative stock is prevented by the conditional `WHERE stock_quantity >= $1` clause.

---



## Concurrent Order Handling

**Scenario:** A product has **1 unit** left. User A and User B submit an order for that item at the same time.

**How only one succeeds:**

1. **Transaction isolation** — Each order runs in `BEGIN` … `COMMIT` / `ROLLBACK`.
2. **Row-level lock** — `SELECT … FOR UPDATE` locks the product row. User B's transaction waits until User A's completes.
3. **Conditional update** — After User A commits (stock → 0), User B's lock is released. The stock check fails and the update returns zero rows → `400 Insufficient stock`.
4. **Rollback** — User B's entire transaction is rolled back; no order or stock change is persisted.


| Step | User A                            | User B                                 |
| ---- | --------------------------------- | -------------------------------------- |
| 1    | `BEGIN`                           | `BEGIN`                                |
| 2    | Locks row, stock = 1 ✓            | Waits for lock                         |
| 3    | Updates stock to 0, creates order | —                                      |
| 4    | `COMMIT`                          | Acquires lock, stock = 0               |
| 5    | —                                 | Stock check fails → `ROLLBACK` → `400` |


This prevents both users from successfully purchasing the last available unit.

---



## Postman Collection

**Location:** `postman/Ecommerce-API.postman_collection.json`

**Import steps:**

1. Open Postman → **Import** → select the JSON file above.
2. The collection variable `baseUrl` defaults to `http://localhost:3000`.
3. Run **Auth → Register** or **Auth → Login** — the JWT is automatically saved to the `token` variable.
4. Use **Products** and **Orders** folders to test remaining endpoints.

**Included requests:** Health Check, Register, Login, Create/Get/Update/Delete Product, Create/Get Orders, Get Order by ID.

---



## Known Limitations


| Limitation                         | Details                                                                              |
| ---------------------------------- | ------------------------------------------------------------------------------------ |
| Product endpoints are public       | No JWT required to create, update, or delete products                                |
| No automated tests                 | `npm test` is a placeholder; no unit or integration test suite                       |
| No order pagination                | `GET /orders` returns all orders for the user                                        |
| No dedicated service layer         | Business logic is in controllers, not a separate `services/` folder                  |
| No migration versioning            | `migrate.js` runs all SQL files each time; no `schema_migrations` tracking table     |
| No CORS / rate limiting            | Not configured; suitable for local/demo use                                          |
| Duplicate product IDs in one order | Same product listed twice in `items` is not merged; processed as separate line items |
| Order status workflow              | Orders are created as `"confirmed"` immediately; no pending/cancelled flow           |
|                                    |                                                                                      |


---



## AI Usage

- **ChatGPT:** Used for understanding the assignment requirements, discussing architecture/design decisions, reviewing concepts, and improving documentation.
- **Devin:** Used to assist with implementation/code generation.

---

