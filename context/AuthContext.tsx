import React, { createContext, useState, useEffect, useContext } from 'react';

// Define the shape of the user object
interface User {
  id: string;
  name: string;
  email: string;
  dob?: string;
  phone?: string;
  address?: string;
  bloodGroup?: string;
  allergies?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  profilePhoto?: string;
}

// Define the shape of the context
interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // AUTO-LOGIN MOCK USER (Auth Removed)
    const mockUser: User = {
        id: 'mock-user-123',
        name: 'Guest User',
        email: 'guest@sewa.app'
    };
    setUser(mockUser);
    setToken('mock-token');
    setLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    // No-op
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.clear(); // Or just remove specific keys
    window.location.hash = '#/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
