import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppDispatch } from '../store';
import { resetFilters } from '../store/filtersSlice';

export default function Layout() {
  const { user, isAdmin, signOut } = useAuth();
  const dispatch = useAppDispatch();
  const handleSignOut = () => {
    dispatch(resetFilters());
    signOut();
  };
  return (
    <div className="shell">
      <header className="topbar">
        <NavLink to="/" className="brand" aria-label="Retain home">
          <span className="brand-mark" aria-hidden="true" />
          Retain
        </NavLink>
        <nav className="nav" aria-label="Main">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/expenses">Expenses</NavLink>
          {isAdmin && <NavLink to="/admin">Admin</NavLink>}
        </nav>
        <div className="who">
          <span className="who-name">{user?.name}</span>
          <button className="btn btn-small" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </header>
      <main className="page">
        <Outlet />
      </main>
    </div>
  );
}
