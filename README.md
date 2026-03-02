# NPMX POS – Cafe Point-of-Sale System

A complete, scalable, production-ready full-stack POS web application for cafés.

## Tech Stack

| Layer      | Technology                                     |
|------------|-------------------------------------------------|
| Backend    | Node.js, Express 4, Supabase (PostgreSQL + Auth)|
| Frontend   | Next.js 14 (App Router), React 18, TypeScript   |
| UI         | Tailwind CSS 3, MUI 5, Recharts                 |
| Auth       | Supabase Auth (JWT, role-based access)           |
| Database   | PostgreSQL via Supabase with RLS                 |

## Project Structure

```
npmx-cafe-pos/
├── backend/          # Express REST API
│   ├── api/          # 9 resource modules
│   ├── config/       # Supabase client
│   ├── middleware/    # Auth, validation, errors
│   └── migrations/   # SQL schema & seeds
├── frontend/         # Next.js application
│   └── src/
│       ├── app/      # Pages (pos, dashboard, reports, …)
│       ├── components/ # Shared UI components
│       ├── libs/     # API client, Supabase helpers
│       ├── providers/# Auth & theme providers
│       └── types/    # TypeScript interfaces
```

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (free tier works)

### 1. Clone & Install

```bash
git clone <repo-url> && cd npmx-cafe-pos

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Configure Environment

**Backend** – copy `config/.env.example` → `config/config.env`:

```env
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_KEY=<service_role_key>
SUPABASE_ANON_KEY=<anon_key>
FRONTEND_URL=http://localhost:3000
PORT=4000
NODE_ENV=development
```

**Frontend** – copy `.env.local.example` → `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### 3. Database Setup

Run the migration SQL against your Supabase project (via SQL Editor or CLI):

```bash
cd backend && npm run migrate
# Then seed sample data:
npm run seed
```

### 4. Run

```bash
# Terminal 1 – Backend
cd backend && npm run dev    # http://localhost:4000

# Terminal 2 – Frontend
cd frontend && npm run dev   # http://localhost:3000
```

## Features

### POS & Checkout
- Product browsing with category filters & search
- Product variants (sizes, add-ons) with price modifiers
- Cart management with quantity adjustment
- Discount / promo code validation & application
- Multiple payment methods (Cash, QR, Credit Card, Transfer)
- Auto VAT calculation (7%)
- Split bill functionality

### Inventory
- Real-time stock tracking
- Low-stock alerts
- Stock adjustment (restock, waste, return)
- Transaction history

### Dashboard
- Today & month-to-date KPIs
- Active orders count
- Average order value
- Recent orders & alerts

### Reports
- Sales overview (daily / weekly / monthly bar charts)
- Top-selling products
- Payment method breakdown (pie chart)
- Hourly sales trends (line chart)

### Security
- Supabase Auth with JWT tokens
- Role-based access (admin / manager / cashier)
- Row Level Security (RLS) on all tables
- Rate limiting, CORS, helmet

## Default Users (Seed)

| Role    | Email               | Password |
|---------|---------------------|----------|
| Admin   | admin@npmx.cafe     | admin123 |

*(Create additional users via the admin panel or Supabase dashboard)*

## License

MIT
