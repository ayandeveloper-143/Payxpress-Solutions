import React, { createContext, useContext } from "react";

export interface PurchasedItem {
  slug: string;
  purchasedAt: string;
}

interface PurchasedContextType {
  purchasedItems: PurchasedItem[];
  isPurchased: (slug: string) => boolean;
  getPurchasedItem: (slug: string) => PurchasedItem | undefined;
}

const mockPurchasedItems: PurchasedItem[] = [
  { slug: "web3-crypto-defi-app-ui-kit", purchasedAt: "12 Jan 2024" },
  { slug: "1-vs-1-quiz-app-ui-design-kit", purchasedAt: "28 Feb 2024" },
  { slug: "restaurant-app-ui-design-kit", purchasedAt: "05 Apr 2024" },
];

const PurchasedContext = createContext<PurchasedContextType | undefined>(undefined);

export const PurchasedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const purchasedItems = mockPurchasedItems;

  const isPurchased = (slug: string) => purchasedItems.some((item) => item.slug === slug);

  const getPurchasedItem = (slug: string) => purchasedItems.find((item) => item.slug === slug);

  return (
    <PurchasedContext.Provider value={{ purchasedItems, isPurchased, getPurchasedItem }}>
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
