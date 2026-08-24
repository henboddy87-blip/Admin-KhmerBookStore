import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../api/client';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
  is_active?: boolean;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { name?: string; email?: string; password?: string; avatar?: string }) => Promise<User>;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('admin_token')
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentUser = async (authToken: string) => {
    try {
      const userData = await authApi.me(authToken);
      if (userData.role !== 'admin') {
        throw new Error('Admin access required');
      }
      setUser(userData);
      return userData;
    } catch (err) {
      setToken(null);
      setUser(null);
      localStorage.removeItem('admin_token');
      throw err;
    }
  };

  useEffect(() => {
    if (token) {
      fetchCurrentUser(token)
        .catch(() => {})
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await authApi.login(email, password);
      if (response.user.role !== 'admin') {
        throw new Error('Admin access required');
      }
      setToken(response.access_token);
      setUser(response.user);
      localStorage.setItem('admin_token', response.access_token);
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: { name?: string; email?: string; password?: string; avatar?: string }): Promise<User> => {
    if (!token) throw new Error('Not authenticated');
    const updated = await authApi.updateMe(token, data);
    setUser(updated);
    return updated;
  };

  const refreshUser = async () => {
    if (token) {
      await fetchCurrentUser(token);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('admin_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateProfile, refreshUser, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
