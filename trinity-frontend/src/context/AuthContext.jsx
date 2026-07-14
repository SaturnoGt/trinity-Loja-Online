/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const AuthContext = createContext(null);

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function decodeToken(jwt) {
  try {
    return JSON.parse(atob(jwt.split('.')[1]));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  const fetchProfile = useCallback(
    async (jwtToken) => {
      const currentToken = jwtToken || token;

      if (!currentToken) {
        setUser(null);
        return null;
      }

      try {
        const response = await fetch(
          `${API_URL}/auth/profile`,
          {
            headers: {
              Authorization: `Bearer ${currentToken}`,
            },
            cache: 'no-store',
          }
        );

        if (response.status === 401) {
          logout();
          return null;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error ||
              data?.message ||
              'Erro ao carregar perfil'
          );
        }

        setUser(data);

        return data;
      } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        throw error;
      }
    },
    [logout, token]
  );

  useEffect(() => {
    async function restoreSession() {
      const savedToken = localStorage.getItem('token');

      if (!savedToken) {
        setLoading(false);
        return;
      }

      const payload = decodeToken(savedToken);

      if (!payload) {
        localStorage.removeItem('token');
        setLoading(false);
        return;
      }

      if (
        payload.exp &&
        payload.exp * 1000 <= Date.now()
      ) {
        localStorage.removeItem('token');
        setLoading(false);
        return;
      }

      setToken(savedToken);

      try {
        await fetchProfile(savedToken);
      } catch {
        setUser(payload);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, [fetchProfile]);

  const login = useCallback(async (jwt) => {
    localStorage.setItem('token', jwt);
    setToken(jwt);

    const payload = decodeToken(jwt);

    if (payload) {
      setUser(payload);
    }

    try {
      const response = await fetch(
        `${API_URL}/auth/profile`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
          cache: 'no-store',
        }
      );

      const data = await response.json();

      if (response.ok) {
        setUser(data);
      }
    } catch (error) {
      console.error(
        'Login realizado, mas não foi possível carregar o perfil:',
        error
      );
    }
  }, []);

  const updateProfile = useCallback(
    async (profileData) => {
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch(
        `${API_URL}/auth/profile`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(profileData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            'Erro ao atualizar perfil'
        );
      }

      const updatedUser = data.user || data;

      setUser(updatedUser);

      return updatedUser;
    },
    [token]
  );

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      logout,
      fetchProfile,
      updateProfile,
      isAuthenticated: Boolean(token),
    }),
    [
      user,
      token,
      loading,
      login,
      logout,
      fetchProfile,
      updateProfile,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth precisa ser usado dentro de AuthProvider'
    );
  }

  return context;
}

export default AuthContext;