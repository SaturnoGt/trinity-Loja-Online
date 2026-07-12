/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');

    if (savedToken) {
      try {
        const payload = JSON.parse(atob(savedToken.split('.')[1]));

        setToken(savedToken);
        setUser(payload);
      } catch (err) {
        console.error('Token inválido:', err);
        localStorage.removeItem('token');
      }
    }

    setLoading(false);
  }, []);

  const login = (jwt) => {
    localStorage.setItem('token', jwt);

    const payload = JSON.parse(atob(jwt.split('.')[1]));

    setToken(jwt);
    setUser(payload);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;