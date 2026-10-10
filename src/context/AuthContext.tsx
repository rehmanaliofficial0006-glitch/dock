import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '../types';
import {
  fetchCurrentUser,
  loginUser,
  loginAdmin,
  registerUser,
  logoutUser,
  getStoredToken,
} from '../lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass?: string) => Promise<{ user: User; redirectUrl: string }>;
  adminLogin: (user: string, pass: string) => Promise<{ user: User; redirectUrl: string }>;
  register: (email: string, pass?: string, confirm?: string) => Promise<{ user: User; message: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isApproved: boolean;
  isPending: boolean;
  isRejected: boolean;
  isSuspended: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return null;
    }

    try {
      const freshUser = await fetchCurrentUser();
      setUser(freshUser);
      return freshUser;
    } catch (err) {
      console.warn('Failed to fetch user session:', err);
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, pass?: string) => {
    setIsLoading(true);
    try {
      const res = await loginUser(email, pass);
      setUser(res.user);
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const adminLogin = async (username: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await loginAdmin(username, pass);
      setUser(res.user);
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, pass?: string, confirm?: string) => {
    setIsLoading(true);
    try {
      const res = await registerUser(email, pass, confirm);
      setUser(res.user);
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await logoutUser();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  const isApproved = user?.approval_status === 'approved';
  const isPending = user?.approval_status === 'pending';
  const isRejected = user?.approval_status === 'rejected';
  const isSuspended = user?.approval_status === 'suspended';

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        adminLogin,
        register,
        logout,
        refreshUser,
        isAuthenticated,
        isAdmin,
        isApproved,
        isPending,
        isRejected,
        isSuspended,
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
