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

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001/api'
).replace(/\/$/, '');

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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] =
    useState(true);

  const fetchProfile = useCallback(
    async () => {
      try {
        const response = await fetch(
          `${API_URL}/auth/profile`,
          {
            method: 'GET',
            credentials: 'include',
            headers: {
              Accept:
                'application/json',
            },
            cache: 'no-store',
          }
        );

        const data =
          await readJsonResponse(
            response
          );

        if (
          response.status === 401
        ) {
          setUser(null);
          return null;
        }

        if (!response.ok) {
          throw new Error(
            data?.error ||
              data?.message ||
              'Não foi possível carregar o perfil.'
          );
        }

        const profile =
          data?.user || data;

        if (
          !profile ||
          typeof profile !==
            'object'
        ) {
          throw new Error(
            'O servidor retornou um perfil inválido.'
          );
        }

        setUser(profile);

        return profile;
      } catch (error) {
        console.error(
          'Erro ao buscar perfil:',
          error
        );

        setUser(null);

        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const login = useCallback(
    async (userObject) => {
      if (
        !userObject ||
        typeof userObject !==
          'object'
      ) {
        throw new Error(
          'Dados do usuário inválidos.'
        );
      }

      setUser(userObject);
      setLoading(false);

      return userObject;
    },
    []
  );

  const logout = useCallback(
    async () => {
      try {
        const response = await fetch(
          `${API_URL}/auth/logout`,
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              Accept:
                'application/json',
            },
          }
        );

        const data =
          await readJsonResponse(
            response
          );

        if (!response.ok) {
          throw new Error(
            data?.error ||
              data?.message ||
              'Não foi possível encerrar a sessão.'
          );
        }

        return data;
      } finally {
        setUser(null);
        setLoading(false);
      }
    },
    []
  );

  const updateProfile =
    useCallback(
      async (profileData) => {
        const response =
          await fetch(
            `${API_URL}/auth/profile`,
            {
              method: 'PUT',
              credentials:
                'include',
              headers: {
                Accept:
                  'application/json',
                'Content-Type':
                  'application/json',
              },
              body: JSON.stringify(
                profileData
              ),
            }
          );

        const data =
          await readJsonResponse(
            response
          );

        if (
          response.status === 401
        ) {
          setUser(null);

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

        const updatedUser =
          data?.user || data;

        if (
          !updatedUser ||
          typeof updatedUser !==
            'object'
        ) {
          throw new Error(
            'O servidor retornou um perfil inválido.'
          );
        }

        setUser(updatedUser);

        return updatedUser;
      },
      []
    );

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      fetchProfile,
      updateProfile,
      isAuthenticated:
        Boolean(user),
    }),
    [
      user,
      loading,
      login,
      logout,
      fetchProfile,
      updateProfile,
    ]
  );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth precisa ser usado dentro de AuthProvider.'
    );
  }

  return context;
}

export default AuthContext;