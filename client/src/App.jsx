import React from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import AriaInterview from './pages/AriaInterview';
import SessionHistory from './pages/SessionHistory';
import PrepAILogo from './components/PrepAILogo';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navLinks = [
    { path: '/practice', label: '🎤 Practice' },
    { path: '/history', label: '📜 History' }
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {/* Navbar */}
      <nav style={{
        backgroundColor: 'rgba(6, 11, 24, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }} className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/practice">
            <PrepAILogo size={36} showText={true} />
          </Link>
          {user && (
            <div className="flex gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="px-4 py-2 rounded-lg text-sm transition-all"
                  style={{
                    color: location.pathname === link.path ? 'var(--cyan)' : 'var(--gray)',
                    backgroundColor: location.pathname === link.path ? 'rgba(23, 215, 255, 0.08)' : 'transparent',
                    fontWeight: location.pathname === link.path ? '500' : '400'
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div style={{
                width: 32, height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #17D7FF, #4F7BFF)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: '#060B18'
              }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm" style={{ color: 'var(--gray)' }}>{user.name}</span>
            </div>
            <button
              onClick={logout}
              className="text-xs px-3 py-1.5 rounded-lg transition-all"
              style={{
                color: 'var(--gray)',
                border: '1px solid var(--border)',
                backgroundColor: 'transparent'
              }}
            >
              Log out
            </button>
          </div>
        )}
      </nav>

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/practice" element={<ProtectedRoute><AriaInterview /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><SessionHistory /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to="/practice" />} />
      </Routes>
    </div>
  );
}