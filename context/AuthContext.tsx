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
    // Check for token in localStorage on mount
    const storedToken = localStorage.getItem('auth-token');
    const storedUser = localStorage.getItem('user-data');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse user data:", error);
        localStorage.removeItem('user-data');
        localStorage.removeItem('auth-token');
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('auth-token', newToken);
    localStorage.setItem('user-data', JSON.stringify(newUser));
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
