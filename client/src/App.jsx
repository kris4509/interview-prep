import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import PracticeSession from './pages/PracticeSession';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow px-6 py-3 flex items-center justify-between">
        <span className="font-semibold text-gray-900">Interview Prep</span>
        {user && (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-600">{user.name}</span>
            <button onClick={logout} className="text-red-600 hover:underline">
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
              <PracticeSession />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/practice" />} />
      </Routes>
    </div>
  );
}