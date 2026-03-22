import React, { useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { Login } from './Login';
import { Dashboard } from './Dashboard';
import './App.css';

function AppContent() {
  const { token } = useAuth();
  const [loginSuccess, setLoginSuccess] = useState(!!token);

  return (
    <div className="App">
      {loginSuccess ? (
        <Dashboard />
      ) : (
        <Login onLoginSuccess={() => setLoginSuccess(true)} />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
