import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '~/api/auth.api';
import type { User } from '~/interfaces/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const authContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const currentUser = await authApi.getMe();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchUser();
  }, []);

  const login = async () => {
    await fetchUser();
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Błąd podczas wylogowywania:', error);
    } finally {
      setUser(null);
    }
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
