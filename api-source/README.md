# PayXpress API Source

## Folder Structure

```text
api-source/
  package.json
  tsconfig.json
  .env.example
  src/
    app.ts
    server.ts
    config/
      db.ts
      env.ts
    controllers/
      contact.controller.ts
      product.controller.ts
    middleware/
      error.middleware.ts
    routes/
      contact.routes.ts
      health.routes.ts
      product.routes.ts
    types/
      product.ts
```

## Endpoints

- `GET /api/health`
- `GET /api/products`
- `GET /api/products/:slug`
- `POST /api/contact`

## Setup

```bash
cd /www/wwwroot/payxpress-solutions.com/api-source
cp .env.example .env
npm install
npm run dev
```

## Database Import

```bash
mysql -u root -p < /www/wwwroot/payxpress-solutions.com/database/mysql/schema.sql
mysql -u root -p payxpress_api < /www/wwwroot/payxpress-solutions.com/database/mysql/seed_products.sql
```

## Example .env

```env
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=payxpress_api
```