import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AriaAvatar from '../components/AriaAvatar';
import PrepAILogo from '../components/PrepAILogo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/practice');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 24,
      background: 'var(--bg-primary)'
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo + Aria */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <AriaAvatar size={100} speaking={false} />
          </div>
          <PrepAILogo size={40} showText={true} />
          <p style={{ color: 'var(--gray)', fontSize: 14, marginTop: 8 }}>
            Welcome back — Aria is ready for you
          </p>
        </div>

        {/* Form card */}
        <div className="glass" style={{ padding: 28 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: 'var(--white)' }}>
            Sign in
          </h1>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 12 }}>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 10, fontSize: 14,
                  background: 'var(--bg-primary)', border: '1px solid var(--border)',
                  color: 'var(--white)', outline: 'none'
                }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 10, fontSize: 14,
                  background: 'var(--bg-primary)', border: '1px solid var(--border)',
                  color: 'var(--white)', outline: 'none'
                }}
              />
            </div>
            {error && (
              <p style={{ color: '#f85149', fontSize: 13, marginBottom: 12 }}>{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', fontSize: 15, padding: '13px' }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--gray)', marginTop: 16 }}>
          No account?{' '}
          <Link to="/register" style={{ color: 'var(--cyan)', textDecoration: 'none', fontWeight: 500 }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}