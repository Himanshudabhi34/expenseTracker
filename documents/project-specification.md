# Daily Expense Tracker Agent — Complete Project Documentation

This document is your complete implementation guide for building the Daily Expense Tracker Agent using the MERN stack.

---

## 1. Project Overview

### 1.1 Project Objective

Build a web application that helps users record daily income and expenses, manage budgets, analyze spending habits, and ask questions about their financial records through a simple expense assistant.
The application should provide both traditional expense-tracking functionality and basic agent-like behavior using JavaScript rules and MongoDB queries.

### 1.2 Main Goals

- Record daily income and expenses.
- Categorize transactions automatically.
- Track monthly budgets and savings goals.
- Display dashboards, charts, and financial summaries.
- Accept expense entries in natural language.
- Answer questions using actual database records.
- Generate simple, personalized spending insights.
- Export transaction reports.
- Keep the application fast and maintainable.
- Avoid paid AI APIs and unnecessary infrastructure in the first version.

### 1.3 Scope of the First Version

The first version should support one authenticated user accessing their own financial information. An admin panel, bank integrations, and a real LLM-powered agent are not required.

---

## 2. Complete Feature List

### 2.1 Authentication and User Profile

- User registration.
- Login and logout.
- Password hashing.
- Profile management.
- Default currency selection, initially INR.
- Timezone configuration.
- Protected application pages.
- Secure access to personal financial records.

### 2.2 Income and Expense Management

Users can add, edit, view, search, filter, and delete transactions.

Each transaction contains:

| Field              | Description                     |
| :----------------- | :------------------------------ |
| **Type**           | Income or expense               |
| **Amount**         | Transaction amount              |
| **Category**       | Food, travel, salary, etc.      |
| **Description**    | Reason for the transaction      |
| **Date**           | Transaction date                |
| **Payment Method** | Cash, UPI, card, bank transfer  |
| **Notes**          | Optional additional information |
| **Created At**     | Record creation timestamp       |

**Example entries:**

- Spent ₹150 on lunch.
- Paid ₹500 for petrol.
- Received ₹45,000 salary.
- Paid ₹1,200 for electricity.

The user should be able to review the parsed details before saving a natural-language entry.

### 2.3 Automatic Categorization

**Suggested categories:**

- Food & Dining
- Groceries
- Travel & Fuel
- Rent & Housing
- Utilities & Bills
- Shopping
- Healthcare
- Education
- Entertainment
- Personal Care
- Subscriptions
- Salary
- Freelance Income
- Other

Use keyword matching initially. If the system cannot confidently identify a category, it should select `Other` and allow the user to correct it.

### 2.4 Dashboard

The dashboard should display:

- Today's total expenses.
- Current month's expenses.
- Current month's income.
- Net balance for a selected period.
- Remaining monthly budget.
- Highest spending category.
- Recent transactions.
- Daily or monthly spending charts.
- Income-versus-expense comparison.

_Calculate totals on the backend rather than downloading every transaction to the frontend._

### 2.5 Budget Management

Users should be able to:

- Set a monthly budget.
- Set category-wise budgets.
- View total spent and remaining budget.
- Configure warning thresholds.
- Receive alerts at 80% and 100% of a budget.
- Review historical budget performance.

_Alerts should not be generated repeatedly every time the dashboard loads. Track whether a threshold alert has already been generated for the relevant budget period._

### 2.6 Expense History and Search

Support filtering by:

- Date range.
- Category.
- Transaction type.
- Payment method.
- Minimum and maximum amount.
- Description or merchant.

_Use pagination with a default page size of 20 and a maximum of 100 records per request._

### 2.7 Reports and Analytics

- Daily summaries.
- Weekly summaries.
- Monthly summaries.
- Category-wise expenditure.
- Highest-value transactions.
- Monthly spending comparison.
- Income-versus-expense reports.
- CSV export.

_CSV exports must safely handle special characters and spreadsheet formula injection._

### 2.8 Expense Agent

This is the main agent feature.

#### Natural-Language Expense Entry

- **User Input:** _"Spent ₹250 on dinner yesterday."_
- **Parsed Extraction:**
  - **Amount:** ₹250
  - **Type:** Expense
  - **Category:** Food & Dining
  - **Date:** Yesterday
  - **Description:** Dinner
- It then presents a draft transaction for confirmation.

#### Expense Questions

Users can ask:

- How much did I spend today?
- What is my total spending this month?
- How much did I spend on petrol?
- Which category has the highest expenses?
- Show my largest expense this month.
- Compare this month with last month.
- How much income did I receive this month?

The agent should retrieve the necessary records from MongoDB and calculate the answer using application logic.
_Important: The agent must not invent transaction totals or guess missing amounts._

### 2.9 Saving Goals

Users can create goals such as:

- Save ₹20,000 for a phone.
- Save ₹50,000 for a trip.
- Build an emergency fund.

Display the target, current saved amount, remaining amount, and progress percentage.

### 2.10 Smart Saving Suggestions

The application can generate simple, explainable insights.

- **Example:** _"Your dining expenses increased from ₹2,000 last month to ₹3,000 this month, an increase of 50%."_

Suggestions must be based on actual data and clearly identify the period being compared.

### 2.11 Future Enhancements

- Receipt scanning with OCR.
- Voice-based expense entry.
- Recurring transactions and reminders.
- Multiple wallets.
- Shared expenses.
- Multi-currency support.
- Optional LLM integration.
- Mobile application.

---

## 3. Technology Stack

| Layer              | Technology                                 |
| :----------------- | :----------------------------------------- |
| **Frontend**       | React.js + Vite                            |
| **Styling**        | CSS or CSS Modules                         |
| **Routing**        | React Router                               |
| **Backend**        | Node.js + Express.js                       |
| **Database**       | MongoDB + Mongoose                         |
| **Authentication** | JWT or secure cookie-based sessions        |
| **Charts**         | Recharts                                   |
| **Validation**     | Zod or express-validator                   |
| **Testing**        | Node.js test runner, Supertest, and Vitest |
| **Formatting**     | Prettier                                   |
| **Linting**        | ESLint                                     |
| **Deployment**     | Static frontend hosting + Node.js server   |

Use a currently supported Node.js LTS release and compatible stable package versions.
_No OpenAI API key, Redis, Docker, or paid AI service is required for the MVP._

---

## 4. Prerequisites

1. Node.js LTS and npm.
2. Git.
3. MongoDB Community Server or a managed MongoDB database.
4. VS Code or another code editor.
5. A modern web browser.
6. Postman or Insomnia for API testing.

### Environment Variables

Create `server/.env.example`:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/daily_expense_tracker
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_ORIGIN=http://localhost:5173
DEFAULT_CURRENCY=INR
DEFAULT_TIMEZONE=Asia/Kolkata
```

---

## 5. Recommended Folder Structure

### 5.1 Root Structure

```text
daily-expense-tracker-agent/
│
├── client/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── src/
│   ├── tests/
│   ├── package.json
│   └── .env.example
│
├── docs/
│   └── project-specification.md
│
├── .gitignore
└── README.md
```

### 5.2 Backend Structure

```text
server/
├── src/
│   ├── config/
│   │   ├── env.js
│   │   └── db.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Transaction.js
│   │   ├── Category.js
│   │   ├── Budget.js
│   │   └── Goal.js
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── transaction.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── budget.controller.js
│   │   ├── report.controller.js
│   │   ├── category.controller.js
│   │   ├── goal.controller.js
│   │   └── agent.controller.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── transaction.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── budget.routes.js
│   │   ├── report.routes.js
│   │   ├── category.routes.js
│   │   ├── goal.routes.js
│   │   └── agent.routes.js
│   │
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── transaction.service.js
│   │   ├── dashboard.service.js
│   │   ├── budget.service.js
│   │   ├── report.service.js
│   │   └── goal.service.js
│   │
│   ├── agents/
│   │   └── expenseAgent/
│   │       ├── parser.js
│   │       ├── categorizer.js
│   │       ├── intentDetector.js
│   │       ├── queryExecutor.js
│   │       └── responseBuilder.js
│   │
│   ├── middleware/
│   │   ├── authenticate.js
│   │   ├── validateRequest.js
│   │   ├── notFound.js
│   │   └── errorHandler.js
│   │
│   ├── validators/
│   │   ├── auth.validator.js
│   │   ├── transaction.validator.js
│   │   └── budget.validator.js
│   │
│   ├── utils/
│   │   ├── dateRange.js
│   │   ├── currency.js
│   │   ├── pagination.js
│   │   └── csv.js
│   │
│   ├── app.js
│   └── server.js
│
├── tests/
│   ├── unit/
│   └── integration/
│
├── package.json
└── .env.example
```

### 5.3 Frontend Structure

```text
client/
└── src/
    ├── api/
    │   ├── apiClient.js
    │   ├── auth.api.js
    │   └── transaction.api.js
    │
    ├── components/
    │   ├── common/
    │   ├── forms/
    │   ├── charts/
    │   └── transactions/
    │
    ├── features/
    │   ├── auth/
    │   ├── dashboard/
    │   ├── transactions/
    │   ├── budgets/
    │   ├── reports/
    │   ├── agent/
    │   └── goals/
    │
    ├── layouts/
    │   └── AppLayout.jsx
    │
    ├── pages/
    ├── hooks/
    ├── utils/
    ├── styles/
    ├── App.jsx
    └── main.jsx
```

---

## 6. Database Design

### 6.1 User Model

`User`: `name`, `email`, `passwordHash`, `currency`, `timezone`, `createdAt`, `updatedAt`

### 6.2 Transaction Model

`Transaction`: `userId`, `type`, `amountMinor`, `currency`, `categoryId`, `description`, `merchant`, `transactionDate`, `paymentMethod`, `notes`, `createdAt`, `updatedAt`

- **Types:** `expense`, `income`
- **Payment Methods:** `cash`, `upi`, `debit_card`, `credit_card`, `bank_transfer`, `other`
- **Financial Precision:** Store amounts in integer minor units (e.g., ₹150.00 $\rightarrow$ 15000 paise).

### 6.3 Category Model

`Category`: `name`, `type`, `iconKey`, `isDefault`, `isActive`, `userId`, `createdAt`, `updatedAt`

### 6.4 Budget Model

`Budget`: `userId`, `name`, `period`, `amountMinor`, `categoryId`, `warningThresholds`, `isActive`, `createdAt`, `updatedAt`

### 6.5 Goal Model

`Goal`: `userId`, `name`, `targetAmountMinor`, `currentAmountMinor`, `targetDate`, `status`, `createdAt`, `updatedAt`

### 6.6 Database Indexes

- **Users:** Unique `email`
- **Transactions:** `{ userId: 1, transactionDate: -1, _id: -1 }`, `{ userId: 1, type: 1, transactionDate: -1 }`, `{ userId: 1, categoryId: 1, transactionDate: -1 }`
- **Goals:** `{ userId: 1, status: 1 }`

---

## 7. API Design

Base Prefix: `/api/v1`

| Method     | Endpoint              | Purpose                           |
| :--------- | :-------------------- | :-------------------------------- |
| **POST**   | `/auth/register`      | Register                          |
| **POST**   | `/auth/login`         | Login                             |
| **POST**   | `/auth/logout`        | Logout                            |
| **GET**    | `/auth/me`            | Get current user                  |
| **PATCH**  | `/users/me`           | Update profile                    |
| **GET**    | `/transactions`       | List and filter transactions      |
| **POST**   | `/transactions`       | Create transaction                |
| **GET**    | `/transactions/:id`   | Get transaction                   |
| **PATCH**  | `/transactions/:id`   | Update transaction                |
| **DELETE** | `/transactions/:id`   | Delete transaction                |
| **GET**    | `/dashboard/summary`  | Dashboard totals                  |
| **GET**    | `/reports/spending`   | Spending analytics                |
| **GET**    | `/reports/export.csv` | CSV export                        |
| **GET**    | `/categories`         | List categories                   |
| **POST**   | `/categories`         | Create custom category            |
| **GET**    | `/budgets`            | List budgets                      |
| **POST**   | `/budgets`            | Create budget                     |
| **PATCH**  | `/budgets/:id`        | Update budget                     |
| **DELETE** | `/budgets/:id`        | Delete budget                     |
| **POST**   | `/agent/message`      | Parse entries or answer questions |
| **GET**    | `/goals`              | List goals                        |
| **POST**   | `/goals`              | Create goal                       |
| **PATCH**  | `/goals/:id`          | Update goal                       |
| **DELETE** | `/goals/:id`          | Delete goal                       |

---

## 8. How the Agent Works Without OpenAI

### 8.1 Expense Entry Workflow

1. User enters text $\rightarrow$ _"Spent ₹250 on dinner yesterday"_
2. **Parser** extracts fields $\rightarrow$ Amount: 250, Type: Expense, Date: Yesterday
3. **Categorizer** suggests category $\rightarrow$ Food & Dining
4. User reviews and confirms.
5. Saved to MongoDB via **Transaction Service**.

### 8.2 Supported Initial Intents

- Daily expense total
- Monthly expense total
- Income total
- Category spending total
- Top spending categories
- Largest transaction
- Current vs. previous month comparison

---

## 9. Security & Coding Standards

- Hash passwords using `bcrypt`.
- Enforce strict authentication on all private routes and scope database queries by `userId`.
- Protect CSV exports against spreadsheet formula injection.
- Store amounts as minor units (integers) to prevent precision errors.
- Centralize error handling and input validation.

---

## 10. Development Roadmap

1. **Phase 1 — Foundation:** Project setup, DB connection, error handlers.
2. **Phase 2 — Authentication:** Registration, JWT/Session handling, User isolation.
3. **Phase 3 — Transactions:** CRUD operations, categories, filters, pagination.
4. **Phase 4 — Dashboard:** Aggregations, charts, date ranges.
5. **Phase 5 — Budgets & Reports:** Budget thresholds, CSV export, analytics.
6. **Phase 6 — Expense Agent:** Rule-based parser, intent detector, question answering.
7. **Phase 7 — Release:** Goals, suggestions, responsive UI, security review.
