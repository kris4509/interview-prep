import React from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import AriaInterview from './pages/AriaInterview';
import SessionHistory from './pages/SessionHistory';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0d1117', color: '#e6edf3' }}>
      <nav style={{ backgroundColor: '#161b22', borderBottom: '1px solid #30363d' }} className="px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <Link to="/practice" className="flex items-center gap-2">
            <span style={{ color: '#06b6d4' }} className="text-xl font-bold tracking-tight">⚡ PrepAI</span>
          </Link>
          {user && (
            <div className="flex gap-1">
              <Link
                to="/practice"
                className="px-3 py-1.5 rounded-md text-sm transition-colors"
                style={{
                  color: location.pathname === '/practice' ? '#06b6d4' : '#8b949e',
                  backgroundColor: location.pathname === '/practice' ? '#0d1117' : 'transparent'
                }}
              >
                Practice
              </Link>
              <Link
                to="/history"
                className="px-3 py-1.5 rounded-md text-sm transition-colors"
                style={{
                  color: location.pathname === '/history' ? '#06b6d4' : '#8b949e',
                  backgroundColor: location.pathname === '/history' ? '#0d1117' : 'transparent'
                }}
              >
                History
              </Link>
            </div>
          )}
        </div>
        {user && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: '#06b6d4', color: '#0d1117' }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm" style={{ color: '#8b949e' }}>{user.name}</span>
            </div>
            <button
              onClick={logout}
              className="text-xs px-3 py-1.5 rounded-md transition-colors"
              style={{ color: '#8b949e', border: '1px solid #30363d' }}
            >
              Log out
            </button>
          </div>
        )}
      </nav>

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/practice"
          element={
            <ProtectedRoute>
              <AriaInterview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <SessionHistory />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/practice" />} />
      </Routes>
    </div>
  );
}