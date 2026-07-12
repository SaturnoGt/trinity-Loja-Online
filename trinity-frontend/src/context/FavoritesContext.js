'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('trinity-favorites');

    if (saved) {
      setFavorites(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      'trinity-favorites',
      JSON.stringify(favorites)
    );
  }, [favorites]);

  function toggleFavorite(product) {
    setFavorites((prev) => {
      const exists = prev.some(
        (item) => item.id === product.id
      );

      if (exists) {
        return prev.filter(
          (item) => item.id !== product.id
        );
      }

      return [
        ...prev,
        product,
      ];
    });
  }

  function isFavorite(id) {
    return favorites.some(
      (item) => item.id === id
    );
  }

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        toggleFavorite,
        isFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}