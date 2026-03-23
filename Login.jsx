import React, { useState } from 'react';
import { useAuth } from './AuthContext';

const API_BASE = process.env.REACT_APP_API_URL || 'https://web-production-57dae.up.railway.app/api';

export const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const endpoint = isRegister ? '/register' : '/login';
      console.log(`📝 Attempting ${isRegister ? 'registration' : 'login'}...`);
      console.log(`📍 Endpoint: ${API_BASE}${endpoint}`);
      
      const body = isRegister 
        ? { email, password, username: email.split('@')[0], fullName } // Use email prefix as username
        : { username, password }; // Login with email/username

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      
      console.log(`📦 Response status: ${response.status}`);
      console.log(`📦 Response data keys:`, Object.keys(data));
      console.log(`📦 Token present:`, !!data.token);
      console.log(`📦 User present:`, !!data.user);

      if (!response.ok) {
        console.error(`❌ Auth failed:`, data);
        setError(data.error || 'Authentication failed');
        return;
      }

      if (!data.token) {
        console.error(`❌ No token in response:`, data);
        setError('Authentication failed: No token received');
        return;
      }

      console.log(`✅ Authentication successful!`);
      console.log(`✅ Logging in user:`, data.user?.email);
      
      login(data.user, data.token);
      onLoginSuccess();
    } catch (err) {
      console.error(`❌ Error:`, err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-200 to-blue-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600">☁️ TomarsCloud</h1>
          <p className="text-gray-500 mt-2">Your personal cloud storage</p>
        </div>

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">Your Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="e.g., Anurag Tomar"
                required={isRegister}
              />
              <p className="text-sm text-gray-500 mt-1">This will display as 'Anurag Tomar's Cloud'</p>
            </div>
          )}

          {isRegister && (
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="your@email.com"
                required={isRegister}
              />
              <p className="text-sm text-gray-500 mt-1">Your login email</p>
            </div>
          )}

          {!isRegister && (
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">Email Address</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="your@email.com"
                required={!isRegister}
              />
            </div>
          )}

          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="••••••••"
              required
            />
            {isRegister && <p className="text-sm text-gray-500 mt-1">At least 8 characters recommended</p>}
          </div>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-sky-400 to-blue-500 text-white font-bold py-2 rounded-lg hover:from-sky-500 hover:to-blue-600 transition disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : (isRegister ? 'Create Account' : 'Sign In')}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setEmail('');
              setPassword('');
              setUsername('');
              setError('');
            }}
            className="w-full mt-4 text-blue-600 hover:underline"
          >
            {isRegister ? 'Already have an account?' : 'Create new account'}
          </button>
        </form>
      </div>
    </div>
  );
};
