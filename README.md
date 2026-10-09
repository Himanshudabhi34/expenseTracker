# Daily Expense Tracker Agent

A MERN-stack web application that helps you record daily income and expenses,
manage budgets, analyze spending habits, and ask questions about your financial
records through a rule-based **expense assistant** — no paid AI API required.

## Features

- **Authentication & profile** — register, login/logout, hashed passwords, currency & timezone settings.
- **Transactions** — add, edit, view, search, filter, paginate and delete income/expense records.
- **Automatic categorization** — keyword matching suggests a category from natural language.
- **Dashboard** — today's expenses, monthly income/expense, net balance, remaining budget, top category, recent transactions and charts.
- **Budgets** — monthly and category budgets with 80% / 100% threshold alerts (de-duplicated per period).
- **Reports & analytics** — daily/weekly/monthly summaries, category breakdown, top transactions, month comparison and safe CSV export.
- **Expense agent** — natural-language expense entry + question answering against real MongoDB records.
- **Saving goals** — targets with progress tracking.
- **Smart saving suggestions** — explainable, data-driven insights.

## Tech stack

| Layer       | Technology                             |
| :---------- | :------------------------------------- |
| Frontend    | React + Vite, React Router, Recharts   |
| Styling     | CSS (custom design system)             |
| Backend     | Node.js + Express                      |
| Database    | MongoDB + Mongoose                     |
| Auth        | JWT (httpOnly cookie + Bearer token)   |
| Validation  | Zod                                    |
| Testing     | Node.js test runner, Supertest, Vitest |
| Lint/Format | ESLint, Prettier                       |

## Prerequisites

1. Node.js LTS (>= 20) and npm
2. MongoDB (local Community Server or a managed URI)
3. Git

## Getting started

```bash
# 1. Install all workspaces
npm install

# 2. Configure the server environment
cp server/.env.example server/.env

# 3. Seed default categories
npm run seed

# 4. Run both server + client in dev mode
npm run dev
```

- API: http://localhost:5000/api/v1
- Client: http://localhost:5173

## Environment variables

See `server/.env.example`.

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/daily_expense_tracker
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_ORIGIN=http://localhost:5173
DEFAULT_CURRENCY=INR
DEFAULT_TIMEZONE=Asia/Kolkata
```

## Scripts

| Command               | Description                     |
| :-------------------- | :------------------------------ |
| `npm run dev`         | Run server + client together    |
| `npm run seed`        | Seed default categories         |
| `npm test`            | Run backend tests               |
| `npm run test:client` | Run frontend tests              |
| `npm run build`       | Build the client for production |
| `npm run lint`        | Lint server + client            |
| `npm run format`      | Format with Prettier            |

## Project structure

See `docs/project-specification.md` for the full specification and folder layout.

## Security notes

- Passwords hashed with bcrypt.
- All private routes require authentication and scope every query by `userId`.
- Monetary values stored as integer **minor units** (paise).
- CSV exports guard against spreadsheet formula injection.
