import { createContext, useContext, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser, login as apiLogin, register as apiRegister, logout as apiLogout } from '../api/auth.js';
import { onUnauthorized } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();

  const {
    data: user = null,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['me'],
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  // Listen for global 401s on non-auth requests
  useEffect(() => {
    onUnauthorized(() => {
      queryClient.setQueryData(['me'], null);
    });
  }, [queryClient]);

  const login = useCallback(
    async (credentials) => {
      const data = await apiLogin(credentials);
      queryClient.setQueryData(['me'], data);
      return data;
    },
    [queryClient],
  );

  const register = useCallback(
    async (formData) => {
      const data = await apiRegister(formData);
      queryClient.setQueryData(['me'], data);
      return data;
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      queryClient.clear();
      queryClient.setQueryData(['me'], null);
    }
  }, [queryClient]);

  const value = {
    user,
    isLoading,
    refetchUser: refetch,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

