import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      const response = await api.get('/auth/user/');
      setUser(response.data);
    } catch (err) {
      console.error("Auth check failed", err);
      // Clean up invalid tokens
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login/', { username, password });
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      
      const userResponse = await api.get('/auth/user/');
      setUser(userResponse.data);
      setLoading(false);
      return true;
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid username or password");
      setLoading(false);
      return false;
    }
  };

  const register = async (username, email, password) => {
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/register/', { username, email, password });
      // Automatically log in after registration
      return await login(username, password);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.username?.[0] || "Registration failed";
      setError(errorMsg);
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
