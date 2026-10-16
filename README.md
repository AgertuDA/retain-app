# Retain: Personal Expense & Budget Manager

Retain lets you record expenses, search and filter them, set a monthly budget and see where your money goes. Admins can manage expense categories and view platform-wide insights.


**Demo admin login (seeded on first server start):** the `ADMIN_EMAIL` / `ADMIN_PASSWORD` you set in the server environment.

## Technologies

| Area | Stack |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, React Router 6 |
| State | **React Context** for authentication and roles; **Redux Toolkit** for expense filtering, searching, sorting and pagination |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB (Atlas in production) |
| Auth | JSON Web Tokens, bcrypt password hashing |
| Styling | Hand-written responsive CSS (no UI library) |

## Main features

**Users**
- Sign up, sign in, sign out; session restored from a stored token
- Create, view, edit and delete expenses (title, amount, category, date, payment method, notes)
- Search by title or notes; filter by category, payment method, date range and amount range; sort by date or amount; server-side pagination
- Monthly budget: set or change it, see total spent, remaining amount and whether you are **within**, **approaching** (80% or more) or **over** budget
- Dashboard for any month: total spent, remaining budget, highest expense, spending by category, recent expenses

**Admins**
- Create, rename and delete categories. Deleting a category moves its expenses to the default **Uncategorized** category, which cannot be renamed or deleted
- Insights: total users, total expenses, total value, expenses this month, spending per category, top 5 and bottom 5 most-used categories, recent expenses, recent users

**Where the required state lives**
- `client/src/context/AuthContext.tsx`: user, token, sign up/in/out, role flag
- `client/src/components/RouteGuards.tsx`: `ProtectedRoute` (with `adminOnly`) and `GuestRoute`, both reading from the Auth context
- `client/src/store/filtersSlice.ts`: every filter, the search text, sort and current page
- `client/src/components/ExpenseFilters.tsx` and `pages/ExpensesPage.tsx`: read and write the Redux store, refetch when it changes

## Project structure

```
retain/
├── client/            React + TypeScript + Vite app
│   └── src/
│       ├── components/  Reusable UI (forms, filters, gauge, modal, guards)
│       ├── context/     AuthContext
│       ├── hooks/       useCategories
│       ├── lib/         API client, formatting helpers
│       ├── pages/       Auth, Dashboard, Expenses, Admin
│       ├── store/       Redux store and filters slice
│       └── types.ts     Shared TypeScript types
└── server/            Express API
    └── src/
        ├── middleware/  JWT auth, admin guard
        ├── models/      User, Category, Expense, Budget
        └── routes/      auth, categories, expenses, budgets, dashboard, admin
```

## Setup (local)

Requirements: Node.js 18+ and a MongoDB instance (local or Atlas).

```bash
# 1. API
cd server
cp .env.example .env        # then edit the values
npm install
npm run dev                 # http://localhost:5000

# 2. Frontend (new terminal)
cd client
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

### Environment variables

`server/.env`

| Variable | Purpose |
| --- | --- |
| `PORT` | API port (default 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random string used to sign tokens |
| `CLIENT_ORIGIN` | Allowed frontend origin(s), comma-separated |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Admin account created on first start if missing |

`client/.env`

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | API base URL including `/api` |
| `VITE_CURRENCY` | ISO currency code for display, e.g. `USD`, `RWF` |

On first start the API creates the **Uncategorized** default category, a set of starter categories and the admin account.

## API reference

All routes are under `/api`. Send `Authorization: Bearer <token>` on everything except register and login. Errors return `{ "message": "..." }` with a suitable status code.

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| POST | `/auth/register` | public | Create a user account, returns token and user |
| POST | `/auth/login` | public | Returns token and user |
| GET | `/auth/me` | user | Current user |
| GET | `/categories` | user | List categories |
| POST | `/categories` | admin | Create category `{ name }` |
| PUT | `/categories/:id` | admin | Rename category |
| DELETE | `/categories/:id` | admin | Delete category; expenses move to Uncategorized |
| GET | `/expenses` | user | Own expenses. Query: `search, category, paymentMethod, dateFrom, dateTo, minAmount, maxAmount, sortBy (date or amount), order (asc or desc), page, limit` |
| GET | `/expenses/:id` | user | One of your expenses |
| POST | `/expenses` | user | Create `{ title, amount, category, date, paymentMethod, notes }` |
| PUT | `/expenses/:id` | user | Update one of your expenses |
| DELETE | `/expenses/:id` | user | Delete one of your expenses |
| GET | `/budgets?month=YYYY-MM` | user | Budget for a month (`amount` is null if unset) |
| PUT | `/budgets` | user | Set or update `{ month, amount }` |
| GET | `/dashboard?month=YYYY-MM` | user | Total spent, budget, remaining, status, highest expense, spending by category, recent expenses |
| GET | `/admin/insights` | admin | Platform insights |

**Authorization:** every expense, budget and dashboard query is filtered by the authenticated user's id, so other users' records return 404. Admin routes pass through `protect` and `adminOnly`. New sign-ups always get the `user` role.

Payment methods: `cash`, `card`, `mobile_money`, `bank_transfer`, `other`.

## Deployment

1. **Database:** create a free MongoDB Atlas cluster, add a database user, allow network access, copy the connection string.
2. **API (Render, Railway or similar):** root directory `server`, build command `npm install`, start command `npm start`. Set the server environment variables above, with `CLIENT_ORIGIN` set to your frontend URL.
3. **Frontend (Vercel or Netlify):** root directory `client`, build command `npm run build`, output directory `dist`. Set `VITE_API_URL` to `https://<your-api-host>/api`. `vercel.json` and `public/_redirects` handle client-side routing.
4. Put both URLs at the top of this README.

## Error handling

- API: validation errors (400), auth failures (401), permission failures (403), missing records (404), duplicates (409), and a catch-all handler that never leaks stack traces
- Client: form validation before submit, inline error banners with retry, loading and empty states, delete confirmations, and a friendly message when the server cannot be reached

## Author
Agertu Diriba