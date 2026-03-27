# PayXpress Solutions

PayXpress Solutions is a TypeScript full-stack web application with:

- A React + Vite frontend in the repository root.
- An Express + TypeScript API in `api-source/`.
- Product browsing, cart persistence, contact enquiries, auth flows, and Cashfree payment session creation.

## Tech Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, React Router
- Backend: Node.js, Express, TypeScript, MySQL, JWT, Nodemailer
- Testing: Vitest (frontend), Playwright config present

## Repository Structure

```text
.
├── src/                 # Frontend source (Vite)
├── public/              # Static assets
├── test/                # Frontend tests
├── api-source/          # Express API source
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── config/
│   │   └── middleware/
│   └── README.md
└── README.md
```

## Prerequisites

- Node.js 18+ (recommended)
- npm 9+ (or Bun, if preferred)
- MySQL 8+

## 1) Install Dependencies

Frontend (root):

```bash
npm install
```

API:

```bash
cd api-source
npm install
```

## 2) Configure Environment Variables

Create environment files manually (no `.env.example` is currently committed).

Root `.env` (frontend):

```env
VITE_API_BASE_URL=http://localhost:8846/api
VITE_CASHFREE_MODE=sandbox
VITE_PAYMENT_GATEWAY_ENABLED=true
```

`api-source/.env` (backend):

```env
PORT=8846
CLIENT_ORIGIN=http://localhost:5173

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=payxpress_api

PAYMENT_GATEWAY_ENABLED=true
CASHFREE_MODE=sandbox
CASHFREE_SANDBOX_APP_ID=
CASHFREE_SANDBOX_SECRET_KEY=
CASHFREE_API_VERSION=2023-08-01

SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_TLS_SERVERNAME=
SMTP_TLS_REJECT_UNAUTHORIZED=true
MAIL_FROM=

OTP_EXPIRY_MINUTES=10
JWT_ACCESS_SECRET=change-me
JWT_ACTION_SECRET=change-me
JWT_ACCESS_EXPIRY=7d
```

## 3) Run the Project Locally

Run backend API (terminal 1):

```bash
cd api-source
npm run dev
```

Run frontend app (terminal 2):

```bash
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- API health: `http://localhost:8846/api/health`

## Frontend Scripts

From repository root:

- `npm run dev` - Start Vite dev server
- `npm run build` - Create production build
- `npm run build:dev` - Create development-mode build
- `npm run preview` - Preview built frontend
- `npm run lint` - Run ESLint
- `npm run test` - Run Vitest once
- `npm run test:watch` - Run Vitest in watch mode

## API Scripts

From `api-source/`:

- `npm run dev` - Start API with `tsx watch`
- `npm run build` - Compile TypeScript to `dist/`
- `npm run start` - Run compiled API from `dist/server.js`

## API Endpoints

All routes are mounted under `/api`:

- `GET /health`
- `GET /products`
- `GET /products/:slug`
- `POST /contact`
- `POST /payments/cashfree/session`
- `POST /auth/signup`
- `POST /auth/signup/verify-link`
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/logout`
- `POST /auth/forgot-password/start`
- `POST /auth/forgot-password/reset`
- `GET /cart`
- `PUT /cart`

## Build Status

The frontend production build command succeeds:

```bash
npm run build
```

## Notes

- Keep frontend and backend origin settings aligned (`VITE_API_BASE_URL` and `CLIENT_ORIGIN`).
- Cashfree keys and SMTP settings are required for payment and email-driven auth flows.
- For API-specific implementation details, see `api-source/README.md`.
