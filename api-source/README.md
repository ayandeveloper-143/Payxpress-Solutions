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

## Product Mapper (API Response Shape)

```ts
const mapProduct = (product: ProductRecord): ProductResponse => ({
  id: product.id,
  slug: product.slug,
  title: product.title,
  description: product.description,
  tag: product.tag,
  price: product.price_label,
  image: product.image,
  overview: product.overview,
  shortNote: product.short_note,
  fullDescription: product.full_description,
  screenshots: parseJsonArray(product.screenshots),
  features: parseJsonArray(product.features),
  cartLimit: product.cart_limit,
});
```

This mapper is used to convert DB columns (snake_case) into API response fields (camelCase).

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

## SQL: Add One Product

Use this query to insert a single product into the `products` table.

```sql
INSERT INTO products (
  slug,
  title,
  description,
  tag,
  price_label,
  image,
  overview,
  product_file,
  short_note,
  full_description,
  screenshots,
  features,
  cart_limit,
  sort_order,
  is_active
) VALUES (
  'nesthub-luxury-villa-ui-kit',
  'NestHub Luxury Villa UI Kit',
  'Premium real-estate inspired UI kit with responsive layouts and modern sections.',
  'UI Kit',
  '₹2,999',
  'public/uploads/nesthub-luxury-villa-ui-kit/cover.webp',
  'A complete design package for property-tech websites and landing pages with conversion-focused sections.',
  'public/uploads/nesthub-luxury-villa-ui-kit/nesthub-luxury-villa-ui-kit.zip',
  'Responsive premium real-estate UI kit for fast product launches.',
  'NestHub Luxury Villa UI Kit includes homepage blocks, listing cards, contact sections, and responsive navigation patterns designed for modern real-estate products.',
  JSON_ARRAY(
    'public/uploads/nesthub-luxury-villa-ui-kit/shot-1.webp',
    'public/uploads/nesthub-luxury-villa-ui-kit/shot-2.webp',
    'public/uploads/nesthub-luxury-villa-ui-kit/shot-3.webp'
  ),
  JSON_ARRAY(
    'React-ready section structure',
    'Mobile-first responsive layout',
    'Property listing and CTA modules',
    'Clean typography and spacing system'
  ),
  1,
  10,
  1
);
```