import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: (credential: string) => Promise<void>;
  demoLogin: (email?: string, name?: string) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const currentUser = await authApi.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          console.warn('Failed to restore session:', error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const loginWithGoogle = async (credential: string) => {
    try {
      setLoading(true);
      const data = await authApi.loginWithGoogle(credential);
      localStorage.setItem('token', data.token);
      setUser(data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Google login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (email?: string, name?: string) => {
    try {
      setLoading(true);
      const data = await authApi.demoLogin(email, name);
      localStorage.setItem('token', data.token);
      setUser(data.user);
      toast.success(`Logged in as ${data.user.name}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUser = (updatedUser: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updatedUser } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithGoogle,
        demoLogin,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
