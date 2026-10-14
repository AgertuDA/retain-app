import { Link, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { GuestRoute, ProtectedRoute } from './components/RouteGuards';
import AdminPage from './pages/AdminPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ExpensesPage from './pages/ExpensesPage';

function NotFound() {
  return (
    <div className="not-found">
      <h1>Page not found</h1>
      <p>That address does not exist.</p>
      <Link className="btn btn-primary" to="/">
        Go to dashboard
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="admin" element={<AdminPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
