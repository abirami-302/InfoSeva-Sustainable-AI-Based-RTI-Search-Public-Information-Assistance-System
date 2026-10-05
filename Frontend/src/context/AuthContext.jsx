import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('infoseva_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [tokens, setTokens] = useState(() => {
    try {
      const accessToken = localStorage.getItem('infoseva_access_token');
      const refreshToken = localStorage.getItem('infoseva_refresh_token');
      return accessToken && refreshToken ? { accessToken, refreshToken } : null;
    } catch {
      return null;
    }
  });

  const login = (role, userData = null, tokenData = null) => {
    const sessionUser = userData || {
      name: 'InfoSeva User',
      email: 'user@infoseva.gov.in',
      role
    };

    setUser({ role, ...sessionUser });
    localStorage.setItem('infoseva_user', JSON.stringify({ role, ...sessionUser }));
    localStorage.setItem('infoseva_user_role', role);

    if (tokenData) {
      setTokens(tokenData);
      localStorage.setItem('infoseva_access_token', tokenData.accessToken);
      localStorage.setItem('infoseva_refresh_token', tokenData.refreshToken);
    }
  };

  const logout = async () => {
    if (tokens?.refreshToken) {
      try {
        await fetch('http://localhost:8081/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: tokens.refreshToken })
        });
      } catch (err) {
        console.warn('Backend logout failed or offline:', err);
      }
    }
    setUser(null);
    setTokens(null);
    localStorage.removeItem('infoseva_user');
    localStorage.removeItem('infoseva_user_role');
    localStorage.removeItem('infoseva_access_token');
    localStorage.removeItem('infoseva_refresh_token');
  };

  const updateUser = (patch) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      localStorage.setItem('infoseva_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, tokens, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}