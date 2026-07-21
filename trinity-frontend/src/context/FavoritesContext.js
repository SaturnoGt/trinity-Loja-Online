'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useAuth } from '@/context/AuthContext';

const FavoritesContext = createContext(null);

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');

async function readResponse(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `A API retornou uma resposta inválida. Status ${response.status}.`
    );
  }
}

function normalizeFavorites(data) {
  const favoriteList = Array.isArray(data)
    ? data
    : Array.isArray(data?.favorites)
      ? data.favorites
      : [];

  const uniqueFavorites = new Map();

  favoriteList.forEach((item) => {
    const product = item?.product || item;
    const productId = Number(product?.id);

    if (
      Number.isInteger(productId) &&
      productId > 0
    ) {
      uniqueFavorites.set(productId, product);
    }
  });

  return Array.from(uniqueFavorites.values());
}

export function FavoritesProvider({ children }) {
  const {
    token,
    loading: authLoading,
    isAuthenticated,
    logout,
  } = useAuth();

  const [favorites, setFavorites] = useState([]);
  const [loadingFavorites, setLoadingFavorites] =
    useState(true);

  const pendingProductsRef = useRef(new Set());
  const requestIdRef = useRef(0);

  const loadFavorites = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    if (!token) {
      setFavorites([]);
      setLoadingFavorites(false);
      return [];
    }

    if (!API_URL) {
      setFavorites([]);
      setLoadingFavorites(false);

      throw new Error(
        'A URL da API não foi configurada no frontend.'
      );
    }

    try {
      setLoadingFavorites(true);

      const response = await fetch(
        `${API_URL}/favorites`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        }
      );

      const data = await readResponse(response);

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
            'Não foi possível carregar os favoritos.'
        );
      }

      const favoriteList =
        normalizeFavorites(data);

      if (requestId === requestIdRef.current) {
        setFavorites(favoriteList);
      }

      return favoriteList;
    } catch (error) {
      console.error(
        'Erro ao carregar favoritos:',
        error
      );

      if (requestId === requestIdRef.current) {
        setFavorites([]);
      }

      throw error;
    } finally {
      if (requestId === requestIdRef.current) {
        setLoadingFavorites(false);
      }
    }
  }, [logout, token]);

  useEffect(() => {
    if (authLoading) {
      setLoadingFavorites(true);
      return;
    }

    if (!isAuthenticated || !token) {
      requestIdRef.current += 1;
      pendingProductsRef.current.clear();
      setFavorites([]);
      setLoadingFavorites(false);
      return;
    }

    loadFavorites().catch(() => {
      // O erro já foi tratado dentro de loadFavorites.
    });
  }, [
    authLoading,
    isAuthenticated,
    loadFavorites,
    token,
  ]);

  const toggleFavorite = useCallback(
    async (product) => {
      if (!token) {
        throw new Error(
          'Você precisa entrar na sua conta para favoritar produtos.'
        );
      }

      if (!API_URL) {
        throw new Error(
          'A URL da API não foi configurada no frontend.'
        );
      }

      const productId = Number(product?.id);

      if (
        !Number.isInteger(productId) ||
        productId <= 0
      ) {
        throw new Error('Produto inválido.');
      }

      if (
        pendingProductsRef.current.has(productId)
      ) {
        return favorites.some(
          (item) =>
            Number(item?.id) === productId
        );
      }

      const alreadyFavorite = favorites.some(
        (item) => Number(item?.id) === productId
      );

      pendingProductsRef.current.add(productId);

      try {
        const response = await fetch(
          `${API_URL}/favorites/${productId}`,
          {
            method: alreadyFavorite
              ? 'DELETE'
              : 'POST',
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await readResponse(response);

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
              'Não foi possível atualizar os favoritos.'
          );
        }

        if (alreadyFavorite) {
          setFavorites((current) =>
            current.filter(
              (item) =>
                Number(item?.id) !== productId
            )
          );

          return false;
        }

        const favoriteProduct =
          data?.product ||
          data?.favorite?.product ||
          product;

        if (
          !favoriteProduct?.id ||
          Number(favoriteProduct.id) !== productId
        ) {
          throw new Error(
            'A API retornou um produto favorito inválido.'
          );
        }

        setFavorites((current) => {
          const exists = current.some(
            (item) =>
              Number(item?.id) === productId
          );

          if (exists) {
            return current;
          }

          return [...current, favoriteProduct];
        });

        return true;
      } finally {
        pendingProductsRef.current.delete(
          productId
        );
      }
    },
    [favorites, logout, token]
  );

  const isFavorite = useCallback(
    (id) => {
      const productId = Number(id);

      if (
        !Number.isInteger(productId) ||
        productId <= 0
      ) {
        return false;
      }

      return favorites.some(
        (item) =>
          Number(item?.id) === productId
      );
    },
    [favorites]
  );

  const value = useMemo(
    () => ({
      favorites,
      loadingFavorites,
      toggleFavorite,
      isFavorite,
      reloadFavorites: loadFavorites,
    }),
    [
      favorites,
      loadingFavorites,
      toggleFavorite,
      isFavorite,
      loadFavorites,
    ]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error(
      'useFavorites precisa ser usado dentro de FavoritesProvider.'
    );
  }

  return context;
}