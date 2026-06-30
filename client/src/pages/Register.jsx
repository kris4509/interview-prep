import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      await register(name, email, password);
      navigate('/practice');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-20 p-6 bg-white shadow rounded-lg">
      <h1 className="text-xl font-semibold mb-4">Create account</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded px-3 py-2 text-sm"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded px-3 py-2 text-sm"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded px-3 py-2 text-sm"
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="w-full bg-indigo-600 text-white rounded py-2 text-sm hover:bg-indigo-700">
          Register
        </button>
      </form>
      <p className="text-sm text-gray-500 mt-4">
        Already have an account? <Link to="/login" className="text-indigo-600">Log in</Link>
      </p>
    </div>
  );
}