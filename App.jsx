import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { Login } from './Login';
import { Dashboard } from './Dashboard';
import './App.css';

function AppContent() {
  const { token, logout } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(!!token);

  // Update login state whenever token changes
  useEffect(() => {
    setIsLoggedIn(!!token);
  }, [token]);

  return (
    <div className="App">
      {isLoggedIn && token ? (
        <Dashboard />
      ) : (
        <Login onLoginSuccess={() => setIsLoggedIn(true)} />
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
