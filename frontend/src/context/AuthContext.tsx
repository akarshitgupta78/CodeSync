import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, AuthResponse } from '../services/auth';

interface AuthContextType {
  user: AuthResponse | null;
  isAuthenticated: boolean;
  login: (username: string, pass: string) => Promise<void>;
  register: (username: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthResponse | null>(() => authService.getCurrentUser());

  useEffect(() => {
    const saved = authService.getCurrentUser();
    if (saved && (!user || user.userId !== saved.userId)) {
      setUser(saved);
    }
  }, []);

  const login = async (username: string, pass: string) => {
    const data = await authService.login(username, pass);
    setUser(data);
  };

  const register = async (username: string, email: string, pass: string) => {
    const data = await authService.register(username, email, pass);
    setUser(data);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
