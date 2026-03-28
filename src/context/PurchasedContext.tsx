import React, { createContext, useContext } from "react";
import { useAuth } from "@/context/AuthContext";

export interface PurchasedItem {
  slug: string;
  purchasedAt: string;
}

interface PurchasedContextType {
  purchasedItems: PurchasedItem[];
  isPurchased: (slug: string) => boolean;
  getPurchasedItem: (slug: string) => PurchasedItem | undefined;
  getPurchasedCount: (slug: string) => number;
}

const PurchasedContext = createContext<PurchasedContextType | undefined>(undefined);

export const PurchasedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const purchasedItems = user?.orderHistory ?? [];

  const isPurchased = (slug: string) => purchasedItems.some((item) => item.slug === slug);

  const getPurchasedItem = (slug: string) => purchasedItems.find((item) => item.slug === slug);

  const getPurchasedCount = (slug: string) => purchasedItems.filter((item) => item.slug === slug).length;

  return (
    <PurchasedContext.Provider value={{ purchasedItems, isPurchased, getPurchasedItem, getPurchasedCount }}>
      {children}
    </PurchasedContext.Provider>
  );
};

export const usePurchased = () => {
  const context = useContext(PurchasedContext);
  if (!context) {
    throw new Error("usePurchased must be used within PurchasedProvider");
  }
  return context;
};
