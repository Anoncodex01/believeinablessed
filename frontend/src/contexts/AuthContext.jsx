// contexts/AuthContext.jsx
'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API_URL } from '@/lib/config';

const AuthContext = createContext(null);
const cookieOptions = { expires: 7, path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production' };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('bib_token') || (typeof window !== 'undefined' ? localStorage.getItem('bib_token') : null);
    const cachedUser = Cookies.get('bib_user') || (typeof window !== 'undefined' ? localStorage.getItem('bib_user') : null);
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
      } catch (_) {
        Cookies.remove('bib_user', { path: '/' });
        if (typeof window !== 'undefined') localStorage.removeItem('bib_user');
      }
    }
    if (token) {
      Cookies.set('bib_token', token, cookieOptions);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchMe();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchMe = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/auth/me`);
      setUser(data.user);
      Cookies.set('bib_user', JSON.stringify(data.user), cookieOptions);
      if (typeof window !== 'undefined') localStorage.setItem('bib_user', JSON.stringify(data.user));
    } catch {
      Cookies.remove('bib_token', { path: '/' });
      Cookies.remove('bib_user', { path: '/' });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('bib_token');
        localStorage.removeItem('bib_user');
      }
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // New function to refresh user data
  const refreshUser = async () => {
    try {
      const token = Cookies.get('bib_token') || (typeof window !== 'undefined' ? localStorage.getItem('bib_token') : null);
      if (!token) {
        setUser(null);
        return null;
      }
      Cookies.set('bib_token', token, cookieOptions);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const { data } = await axios.get(`${API_URL}/auth/me`);
      if (data.user) {
        setUser(data.user);
        Cookies.set('bib_user', JSON.stringify(data.user), cookieOptions);
        if (typeof window !== 'undefined') localStorage.setItem('bib_user', JSON.stringify(data.user));
        return data.user;
      }
      return null;
    } catch (error) {
      console.error('Error refreshing user:', error);
      return null;
    }
  };

  const login = async (email, password) => {
    const { data } = await axios.post(`${API_URL}/auth/login`, { email, password });
    Cookies.set('bib_token', data.token, cookieOptions);
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser(data.user);
    Cookies.set('bib_user', JSON.stringify(data.user), cookieOptions);
    if (typeof window !== 'undefined') {
      localStorage.setItem('bib_token', data.token);
      localStorage.setItem('bib_user', JSON.stringify(data.user));
    }
    return data.user;
  };

  const register = async (formData) => {
    const { data } = await axios.post(`${API_URL}/auth/register`, formData);
    Cookies.set('bib_token', data.token, cookieOptions);
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser(data.user);
    Cookies.set('bib_user', JSON.stringify(data.user), cookieOptions);
    if (typeof window !== 'undefined') {
      localStorage.setItem('bib_token', data.token);
      localStorage.setItem('bib_user', JSON.stringify(data.user));
    }
    return data.user;
  };

  const logout = () => {
    Cookies.remove('bib_token', { path: '/' });
    Cookies.remove('bib_user', { path: '/' });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bib_token');
      localStorage.removeItem('bib_user');
    }
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';
  const isAffiliate = user?.role === 'affiliate' || user?.role === 'affiliate_pending' || isAdmin;
  const isAffiliatePending = user?.role === 'affiliate_pending';

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      logout, 
      isAdmin, 
      isAffiliate,
      isAffiliatePending,
      refreshUser,
      fetchMe
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
