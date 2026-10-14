import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ErrorBanner } from '../components/Feedback';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../lib/api';

export default function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';
  const isLogin = mode === 'login';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isLogin && !name.trim()) return setError('Enter your name.');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address.');
    if (password.length < 6) return setError('Use a password of at least 6 characters.');

    setBusy(true);
    setError('');
    try {
      if (isLogin) await signIn(email, password);
      else await signUp(name.trim(), email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth-intro">
        <span className="brand">
          <span className="brand-mark" aria-hidden="true" />
          Retain
        </span>
        <h1>Know what is left before you spend it.</h1>
        <p>Log expenses, set a monthly budget and watch it fill up as the month goes on.</p>
      </div>
      <form className="auth-card form" onSubmit={submit} noValidate>
        <h2>{isLogin ? 'Sign in' : 'Create your account'}</h2>
        <ErrorBanner message={error} />
        {!isLogin && (
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </label>
        )}
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={isLogin ? 'current-password' : 'new-password'} />
        </label>
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
        </button>
        <p className="auth-switch">
          {isLogin ? (
            <>
              New to Retain? <Link to="/register">Create an account</Link>
            </>
          ) : (
            <>
              Already have an account? <Link to="/login">Sign in</Link>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
