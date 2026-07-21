"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const CartContext = createContext(null);

const STORAGE_KEY = "cart";

function sanitizeCart(cart) {
  if (!Array.isArray(cart)) {
    return [];
  }

  return cart.filter(
    (item) =>
      item?.product?.id &&
      item?.variation?.id &&
      Number(item.quantity) > 0
  );
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (!stored) {
        setCart([]);
      } else {
        setCart(sanitizeCart(JSON.parse(stored)));
      }
    } catch (error) {
      console.error(
        "Erro ao carregar carrinho:",
        error
      );

      localStorage.removeItem(STORAGE_KEY);
      setCart([]);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(cart)
    );
  }, [cart, hydrated]);

  useEffect(() => {
    function sync(event) {
      if (event.key !== STORAGE_KEY) {
        return;
      }

      try {
        setCart(
          sanitizeCart(
            JSON.parse(event.newValue || "[]")
          )
        );
      } catch {
        setCart([]);
      }
    }

    window.addEventListener("storage", sync);

    return () =>
      window.removeEventListener(
        "storage",
        sync
      );
  }, []);

  const addToCart = useCallback(
    (product, variation) => {
      if (!product?.id || !variation?.id) {
        return false;
      }

      const stock = Number(variation.stock);

      if (
        !Number.isFinite(stock) ||
        stock <= 0
      ) {
        return false;
      }

      setCart((current) => {
        const index = current.findIndex(
          (item) =>
            Number(item.product.id) ===
              Number(product.id) &&
            Number(item.variation.id) ===
              Number(variation.id)
        );

        if (index === -1) {
          return [
            ...current,
            {
              product,
              variation,
              quantity: 1,
            },
          ];
        }

        return current.map((item, i) => {
          if (i !== index) {
            return item;
          }

          return {
            ...item,
            quantity: Math.min(
              item.quantity + 1,
              stock
            ),
          };
        });
      });

      return true;
    },
    []
  );

  const removeFromCart = useCallback(
    (productId, variationId) => {
      setCart((current) =>
        current.filter(
          (item) =>
            !(
              Number(item.product.id) ===
                Number(productId) &&
              Number(item.variation.id) ===
                Number(variationId)
            )
        )
      );
    },
    []
  );

  const updateQuantity = useCallback(
    (
      productId,
      variationId,
      quantity
    ) => {
      const newQuantity = Number(quantity);

      if (
        !Number.isInteger(newQuantity)
      ) {
        return;
      }

      if (newQuantity <= 0) {
        removeFromCart(
          productId,
          variationId
        );
        return;
      }

      setCart((current) =>
        current.map((item) => {
          if (
            Number(item.product.id) !==
              Number(productId) ||
            Number(item.variation.id) !==
              Number(variationId)
          ) {
            return item;
          }

          const stock = Number(
            item.variation.stock
          );

          return {
            ...item,
            quantity: Math.min(
              newQuantity,
              stock
            ),
          };
        })
      );
    },
    [removeFromCart]
  );

  const clearCart = useCallback(() => {
    setCart([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const totalItems = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum + Number(item.quantity || 0),
        0
      ),
    [cart]
  );

  const totalPrice = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum +
          Number(item.product?.price || 0) *
            Number(item.quantity || 0),
        0
      ),
    [cart]
  );

  const value = useMemo(
    () => ({
      cart,
      hydrated,
      totalItems,
      totalPrice,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
    }),
    [
      cart,
      hydrated,
      totalItems,
      totalPrice,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
    ]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart precisa ser usado dentro de CartProvider."
    );
  }

  return context;
}