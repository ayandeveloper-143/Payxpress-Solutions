import React, { createContext, useContext, useState, useEffect } from "react";
import { CartItem } from "@/types/cart";
import { useAuth } from "@/context/AuthContext";
import { fetchUserCart, saveUserCart } from "@/lib/api";

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => boolean;
  removeFromCart: (slug: string) => void;
  updateQuantity: (slug: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => string;
  getTotalItems: () => number;
  cartSheetOpen: boolean;
  setCartSheetOpen: (open: boolean) => void;
  openCartSheet: () => void;
  syncCartToServer: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartSheetOpen, setCartSheetOpen] = useState(false);
  const openCartSheet = () => setCartSheetOpen(true);
  const { user, isLoggedIn, isAuthLoading } = useAuth();
  const [hasHydrated, setHasHydrated] = useState(false);
  const CART_STORAGE_KEY = "cart";

  const isPurchased = (slug: string) => (user?.orderHistory ?? []).some((item) => item.slug === slug);

  const removePurchasedItems = (items: CartItem[]) => {
    if (!user?.orderHistory?.length) {
      return items;
    }

    const purchasedSlugs = new Set(user.orderHistory.map((item) => item.slug));
    const filtered = items.filter((item) => !purchasedSlugs.has(item.slug));
    return filtered.length === items.length ? items : filtered;
  };

  const isValidCartItem = (value: unknown): value is CartItem => {
    if (!value || typeof value !== "object") {
      return false;
    }

    const item = value as Partial<CartItem>;

    return (
      typeof item.slug === "string" &&
      item.slug.length > 0 &&
      typeof item.title === "string" &&
      typeof item.price === "string" &&
      typeof item.image === "string" &&
      typeof item.quantity === "number" &&
      typeof item.cartLimit === "number" &&
      Number.isFinite(item.quantity) &&
      Number.isFinite(item.cartLimit) &&
      item.cartLimit > 0 &&
      item.quantity > 0
    );
  };

  const clampCartItem = (item: CartItem): CartItem => ({
    ...item,
    cartLimit: Math.max(1, Math.trunc(item.cartLimit)),
    quantity: Math.min(Math.max(1, Math.trunc(item.quantity)), Math.max(1, Math.trunc(item.cartLimit))),
  });

  const readCartFromStorage = (): CartItem[] => {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        localStorage.removeItem(CART_STORAGE_KEY);
        return [];
      }

      const validItems = parsed.filter(isValidCartItem);

      if (validItems.length !== parsed.length) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(validItems));
      }

      return removePurchasedItems(validItems);
    } catch (error) {
      console.error("Failed to parse cart from localStorage", error);
      localStorage.removeItem(CART_STORAGE_KEY);
      return [];
    }
  };

  const mergeCartItems = (baseCart: CartItem[], extraCart: CartItem[]) => {
    const map = new Map<string, CartItem>();

    for (const item of baseCart) {
      map.set(item.slug, { ...item });
    }

    for (const item of extraCart) {
      const existing = map.get(item.slug);

      if (existing) {
        map.set(item.slug, {
          ...existing,
          cartLimit: item.cartLimit,
          quantity: Math.min(existing.quantity + item.quantity, item.cartLimit),
        });
      } else {
        map.set(item.slug, clampCartItem(item));
      }
    }

    return Array.from(map.values());
  };

  // Bootstrap guest cart from localStorage before auth-based sync kicks in.
  useEffect(() => {
    setCart(readCartFromStorage());
    setHasHydrated(true);
  }, []);

  // Keep a local snapshot for both guest and logged-in users so the cart can hydrate immediately.
  useEffect(() => {
    if (!hasHydrated || isAuthLoading) {
      return;
    }

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart, hasHydrated, isAuthLoading]);

  // On auth change, load/merge server cart.
  useEffect(() => {
    if (!hasHydrated || isAuthLoading || !isLoggedIn) {
      return;
    }

    const syncOnLogin = async () => {
      try {
        const localCart = readCartFromStorage();
        const response = await fetchUserCart();
        const mergedCart = removePurchasedItems(mergeCartItems(response.cart, localCart));

        setCart(mergedCart);
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(mergedCart));
        await saveUserCart({ cart: mergedCart });
      } catch (error) {
        console.error("Failed to sync cart from server", error);
      }
    };

    syncOnLogin();
  }, [hasHydrated, isAuthLoading, isLoggedIn]);

  // Ensure purchased products are never kept in cart after order history refresh.
  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    setCart((prevCart) => removePurchasedItems(prevCart));
  }, [hasHydrated, user?.orderHistory]);

  // Persist server cart whenever logged-in cart changes.
  useEffect(() => {
    if (!hasHydrated || isAuthLoading || !isLoggedIn) {
      return;
    }

    const timeout = setTimeout(() => {
      saveUserCart({ cart }).catch((error) => {
        console.error("Failed to save cart to server", error);
      });
    }, 200);

    return () => clearTimeout(timeout);
  }, [cart, hasHydrated, isAuthLoading, isLoggedIn]);

  const addToCart = (item: CartItem): boolean => {
    if (isPurchased(item.slug)) {
      setCart((prevCart) => prevCart.filter((entry) => entry.slug !== item.slug));
      return false;
    }

    setCart((prevCart) => {
      const normalizedItem = clampCartItem(item);
      const existingItem = prevCart.find((i) => i.slug === item.slug);
      if (existingItem) {
        return prevCart.map((i) =>
          i.slug === item.slug
            ? {
              ...i,
              cartLimit: normalizedItem.cartLimit,
              quantity: Math.min(i.quantity + normalizedItem.quantity, normalizedItem.cartLimit),
            }
            : i
        );
      }
      return [...prevCart, normalizedItem];
    });

    return true;
  };

  const removeFromCart = (slug: string) => {
    setCart((prevCart) => prevCart.filter((i) => i.slug !== slug));
  };

  const updateQuantity = (slug: string, quantity: number) => {
    setCart((prevCart) => {
      if (isPurchased(slug)) {
        return prevCart.filter((item) => item.slug !== slug);
      }

      const existingItem = prevCart.find((item) => item.slug === slug);

      if (!existingItem) {
        return prevCart;
      }

      if (quantity <= 0) {
        return prevCart.filter((item) => item.slug !== slug);
      }

      return prevCart.map((item) =>
        item.slug === slug
          ? { ...item, quantity: Math.min(quantity, item.cartLimit) }
          : item
      );
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotalPrice = (): string => {
    const total = cart.reduce((acc, item) => {
      const price = parseFloat(item.price.replace("₹", "").replace(",", ""));
      return acc + price * item.quantity;
    }, 0);
    return `₹${total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  };

  const getTotalItems = (): number => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  };

  // Public method to force sync cart to server
  const syncCartToServer = async () => {
    try {
      await saveUserCart({ cart });
    } catch (error) {
      console.error("Failed to sync cart to server", error);
    }
  };

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalPrice,
      getTotalItems,
      cartSheetOpen,
      setCartSheetOpen,
      openCartSheet,
      syncCartToServer,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
