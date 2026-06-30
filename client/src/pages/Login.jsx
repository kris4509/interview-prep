import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      navigate('/practice');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#0d1117' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-3xl font-bold" style={{ color: '#06b6d4' }}>⚡ PrepAI</span>
          <p className="text-sm mt-2" style={{ color: '#8b949e' }}>AI-powered interview practice</p>
        </div>

        <div className="p-6 rounded-xl" style={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}>
          <h1 className="text-lg font-semibold mb-5" style={{ color: '#e6edf3' }}>Sign in</h1>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{ backgroundColor: '#0d1117', border: '1px solid #30363d', color: '#e6edf3' }}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{ backgroundColor: '#0d1117', border: '1px solid #30363d', color: '#e6edf3' }}
              required
            />
            {error && <p className="text-xs" style={{ color: '#f85149' }}>{error}</p>}
            <button
              className="w-full py-2.5 rounded-lg text-sm font-medium mt-1"
              style={{ backgroundColor: '#06b6d4', color: '#0d1117' }}
            >
              Sign in
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-4" style={{ color: '#8b949e' }}>
          No account?{' '}
          <Link to="/register" style={{ color: '#06b6d4' }}>Create one</Link>
        </p>
      </div>
    </div>
  );
}