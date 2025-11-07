import React, { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react';
import { authAPI } from '../api/auth.api';
import type { User, LoginInput, SignupInput } from '../utils/types';

interface AuthContextType {
  u_name: User | null;
  login: (credentials: LoginInput) => Promise<void>;
  signup: (userData: SignupInput) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (credentials: LoginInput) => {
    // replace with real API call
    // const { token, user: userData } = await authAPI.login(credentials);

    // mock login
    const token = 'mocked_jwt_token';
    const userData = { id: 1, name: 'Mock User', email: credentials.email, role: 'user' };
    console.log(userData)

    localStorage.setItem('access_token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData as any);
  };

  const signup = async (userData: SignupInput) => {
    // replace with real API call
    const token = 'mocked_jwt_token';
    localStorage.setItem('access_token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData as any);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/auth/login';
  };

  return (
    <AuthContext.Provider
      value={{
        u_name : user,
        login,
        signup,
        logout,
        loading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
