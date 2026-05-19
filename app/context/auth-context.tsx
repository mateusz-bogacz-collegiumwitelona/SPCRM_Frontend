import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';

interface User {
  token: string;
  userId: string;
  email: string;
  userName: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
}

const authContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // <-- DODANE: Na start aplikacja "ładuje" stan

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('role', JSON.stringify(userData.roles));
    localStorage.setItem('token', userData.token);
    localStorage.setItem('userId', userData.userId);
    localStorage.setItem('email', userData.email);
    localStorage.setItem('userName', userData.userName);
  };

  const logout = () => {
    setUser(null);
    localStorage.clear();
  };

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      logout,
    }),
    [user, isLoading],
  );

  return <authContext.Provider value={value}>{children}</authContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(authContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
