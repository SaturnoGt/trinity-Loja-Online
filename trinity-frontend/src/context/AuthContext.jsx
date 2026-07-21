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

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');

async function readJsonResponse(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `O servidor retornou uma resposta inválida. Status ${response.status}.`
    );
  }
}

function decodeToken(jwt) {
  if (
    !jwt ||
    typeof jwt !== 'string' ||
    jwt.split('.').length !== 3
  ) {
    return null;
  }

  try {
    const payload = jwt.split('.')[1];

    const normalizedPayload = payload
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(
        payload.length + ((4 - (payload.length % 4)) % 4),
        '='
      );

    return JSON.parse(atob(normalizedPayload));
  } catch {
    return null;
  }
}

function isTokenExpired(payload) {
  if (!payload?.exp) {
    return false;
  }

  return payload.exp * 1000 <= Date.now();
}

function getSavedToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem('token');
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }

    setToken(null);
    setUser(null);
    setLoading(false);
  }, []);

  const fetchProfile = useCallback(
    async (jwtToken) => {
      const currentToken =
        jwtToken || getSavedToken();

      if (!currentToken) {
        setUser(null);
        return null;
      }

      if (!API_URL) {
        throw new Error(
          'A URL da API não foi configurada no frontend.'
        );
      }

      const response = await fetch(
        `${API_URL}/auth/profile`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${currentToken}`,
          },
          cache: 'no-store',
        }
      );

      const data = await readJsonResponse(response);

      if (response.status === 401) {
        logout();
        return null;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            'Não foi possível carregar o perfil.'
        );
      }

      const profile = data?.user || data;

      if (!profile || typeof profile !== 'object') {
        throw new Error(
          'O servidor retornou um perfil inválido.'
        );
      }

      setUser(profile);

      return profile;
    },
    [logout]
  );

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      const savedToken = getSavedToken();

      if (!savedToken) {
        if (active) {
          setLoading(false);
        }

        return;
      }

      const payload = decodeToken(savedToken);

      if (!payload || isTokenExpired(payload)) {
        localStorage.removeItem('token');

        if (active) {
          setToken(null);
          setUser(null);
          setLoading(false);
        }

        return;
      }

      if (active) {
        setToken(savedToken);
      }

      try {
        const profile =
          await fetchProfile(savedToken);

        if (
          active &&
          !profile &&
          getSavedToken()
        ) {
          setUser(payload);
        }
      } catch (error) {
        console.error(
          'Erro ao restaurar sessão:',
          error
        );

        if (active) {
          setUser(payload);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, [fetchProfile]);

  useEffect(() => {
    function handleStorage(event) {
      if (event.key !== 'token') {
        return;
      }

      if (!event.newValue) {
        setToken(null);
        setUser(null);
        return;
      }

      const payload = decodeToken(event.newValue);

      if (!payload || isTokenExpired(payload)) {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        return;
      }

      setToken(event.newValue);
      setUser(payload);

      fetchProfile(event.newValue).catch((error) => {
        console.error(
          'Erro ao sincronizar sessão:',
          error
        );
      });
    }

    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(
        'storage',
        handleStorage
      );
    };
  }, [fetchProfile]);

  const login = useCallback(
    async (jwt) => {
      if (!jwt || typeof jwt !== 'string') {
        throw new Error(
          'Token de autenticação inválido.'
        );
      }

      const payload = decodeToken(jwt);

      if (!payload) {
        throw new Error(
          'Não foi possível validar a sessão.'
        );
      }

      if (isTokenExpired(payload)) {
        throw new Error(
          'A sessão recebida já está expirada.'
        );
      }

      localStorage.setItem('token', jwt);
      setToken(jwt);
      setUser(payload);

      try {
        const profile = await fetchProfile(jwt);

        return profile || payload;
      } catch (error) {
        console.error(
          'Login realizado, mas não foi possível carregar o perfil:',
          error
        );

        return payload;
      }
    },
    [fetchProfile]
  );

  const updateProfile = useCallback(
    async (profileData) => {
      if (!token) {
        throw new Error('Usuário não autenticado.');
      }

      if (!API_URL) {
        throw new Error(
          'A URL da API não foi configurada no frontend.'
        );
      }

      const response = await fetch(
        `${API_URL}/auth/profile`,
        {
          method: 'PUT',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(profileData),
        }
      );

      const data = await readJsonResponse(response);

      if (response.status === 401) {
        logout();

        throw new Error(
          'Sua sessão expirou. Entre novamente.'
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            'Não foi possível atualizar o perfil.'
        );
      }

      const updatedUser = data?.user || data;

      if (
        !updatedUser ||
        typeof updatedUser !== 'object'
      ) {
        throw new Error(
          'O servidor retornou um perfil inválido.'
        );
      }

      setUser(updatedUser);

      return updatedUser;
    },
    [logout, token]
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
      'useAuth precisa ser usado dentro de AuthProvider.'
    );
  }

  return context;
}

export default AuthContext;