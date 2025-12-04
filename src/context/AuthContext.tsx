import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, AuthContextType, UserDto } from '../types';
import { STORAGE_KEYS } from '../constants';
import { usersApi } from '../api/users';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    
    if (token && userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        
        // Fetch updated user data from API to get role and organization info
        usersApi.getCurrentUser()
          .then((fullUserData: UserDto) => {
            const updatedUser: User = {
              ...userData,
              role: fullUserData.role,
              organization: fullUserData.organization,
            };
            setUser(updatedUser);
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
          })
          .catch((error) => {
            console.warn('Failed to fetch user data:', error);
          })
          .finally(() => {
            setIsLoading(false);
          });
      } catch (error) {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = (token: string, refreshToken: string, email: string, userId: string) => {
    const userData: User = {
      userId,
      email,
      token,
      role: 'USER', // Default role, will be updated from API
    };
    
    setUser(userData);
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    
    // Fetch full user data from API
    usersApi.getCurrentUser()
      .then((fullUserData: UserDto) => {
        const updatedUser: User = {
          ...userData,
          role: fullUserData.role,
          organization: fullUserData.organization,
        };
        setUser(updatedUser);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      })
      .catch((error) => {
        console.warn('Failed to fetch user data after login:', error);
      });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  };

  const hasRole = (role: 'ADMIN' | 'USER' | 'SUPER_USER'): boolean => {
    return user?.role === role;
  };

  const isAdmin = (): boolean => {
    return hasRole('ADMIN');
  };

  const isUserOrSuperUser = (): boolean => {
    return hasRole('USER') || hasRole('SUPER_USER');
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading,
    hasRole,
    isAdmin,
    isUserOrSuperUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};