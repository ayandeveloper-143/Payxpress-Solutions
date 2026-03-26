import React from "react";
import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CartProvider, useCart } from "@/context/CartContext";
import type { CartItem } from "@/types/cart";

// Mock AuthContext so CartProvider can be tested in isolation.
vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(() => ({ isLoggedIn: false, isAuthLoading: false })),
}));

// Mock API so server-sync effects don't make real network calls.
vi.mock("@/lib/api", () => ({
  fetchUserCart: vi.fn(),
  saveUserCart: vi.fn(),
}));

import { useAuth } from "@/context/AuthContext";
import { fetchUserCart, saveUserCart } from "@/lib/api";

const mockUseAuth = vi.mocked(useAuth);
const mockFetchUserCart = vi.mocked(fetchUserCart);
const mockSaveUserCart = vi.mocked(saveUserCart);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    slug: "product-1",
    title: "Product 1",
    price: "₹1,000",
    image: "/img.png",
    quantity: 1,
    cartLimit: 5,
    ...overrides,
  };
}

/** Renders CartProvider with a consumer component that exposes actions/state via data-testids. */
function CartConsumer() {
  const {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
  } = useCart();

  return (
    <div>
      <span data-testid="cart-length">{cart.length}</span>
      <span data-testid="total-items">{getTotalItems()}</span>
      <span data-testid="total-price">{getTotalPrice()}</span>
      <ul>
        {cart.map((item) => (
          <li key={item.slug} data-testid={`item-${item.slug}`}>
            {item.slug}:{item.quantity}
          </li>
        ))}
      </ul>
      <button data-testid="add-btn" onClick={() => addToCart(makeItem())} />
      <button
        data-testid="add-2-btn"
        onClick={() => addToCart(makeItem({ slug: "product-2", price: "₹500" }))}
      />
      <button
        data-testid="remove-btn"
        onClick={() => removeFromCart("product-1")}
      />
      <button
        data-testid="update-qty-btn"
        onClick={() => updateQuantity("product-1", 3)}
      />
      <button
        data-testid="update-zero-btn"
        onClick={() => updateQuantity("product-1", 0)}
      />
      <button data-testid="clear-btn" onClick={() => clearCart()} />
    </div>
  );
}

function renderCart() {
  return render(
    <CartProvider>
      <CartConsumer />
    </CartProvider>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("useCart", () => {
  it("throws when used outside CartProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<CartConsumer />)).toThrow(
      "useCart must be used within CartProvider",
    );
    spy.mockRestore();
  });
});

describe("CartProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Default: not logged in
    mockUseAuth.mockReturnValue({ isLoggedIn: false, isAuthLoading: false } as ReturnType<typeof useAuth>);
    mockSaveUserCart.mockResolvedValue({ message: "Saved", cart: [] });
    mockFetchUserCart.mockResolvedValue({ cart: [] });
  });

  it("starts with an empty cart when localStorage is empty", async () => {
    await act(async () => {
      renderCart();
    });
    expect(screen.getByTestId("cart-length").textContent).toBe("0");
    expect(screen.getByTestId("total-items").textContent).toBe("0");
  });

  it("loads cart from localStorage on mount", async () => {
    const stored: CartItem[] = [makeItem({ quantity: 2 })];
    localStorage.setItem("cart", JSON.stringify(stored));

    await act(async () => {
      renderCart();
    });

    expect(screen.getByTestId("cart-length").textContent).toBe("1");
    expect(screen.getByTestId("total-items").textContent).toBe("2");
  });

  it("ignores invalid items when loading from localStorage", async () => {
    const invalid = [
      { slug: "", title: "Bad", price: "₹100", image: "", quantity: 1, cartLimit: 5 }, // empty slug
      { slug: "ok", title: "OK", price: "₹100", image: "", quantity: 1, cartLimit: 5 }, // valid
    ];
    localStorage.setItem("cart", JSON.stringify(invalid));

    await act(async () => {
      renderCart();
    });

    expect(screen.getByTestId("cart-length").textContent).toBe("1");
  });

  it("handles corrupt JSON in localStorage gracefully", async () => {
    localStorage.setItem("cart", "not valid json");

    await act(async () => {
      renderCart();
    });

    expect(screen.getByTestId("cart-length").textContent).toBe("0");
  });

  it("handles non-array JSON in localStorage gracefully", async () => {
    localStorage.setItem("cart", JSON.stringify({ slug: "x" }));

    await act(async () => {
      renderCart();
    });

    expect(screen.getByTestId("cart-length").textContent).toBe("0");
  });

  // -------------------------------------------------------------------------
  // addToCart
  // -------------------------------------------------------------------------
  it("addToCart adds a new item to the cart", async () => {
    await act(async () => {
      renderCart();
    });
    await act(async () => {
      screen.getByTestId("add-btn").click();
    });
    expect(screen.getByTestId("cart-length").textContent).toBe("1");
    expect(screen.getByTestId("total-items").textContent).toBe("1");
  });

  it("addToCart increases quantity for an existing item", async () => {
    await act(async () => {
      renderCart();
    });
    await act(async () => {
      screen.getByTestId("add-btn").click();
    });
    await act(async () => {
      screen.getByTestId("add-btn").click();
    });
    expect(screen.getByTestId("cart-length").textContent).toBe("1");
    expect(screen.getByTestId("total-items").textContent).toBe("2");
  });

  it("addToCart clamps quantity to cartLimit", async () => {
    await act(async () => {
      renderCart();
    });
    // Add 10 times; cartLimit is 5
    for (let i = 0; i < 10; i++) {
      await act(async () => {
        screen.getByTestId("add-btn").click();
      });
    }
    expect(screen.getByTestId("total-items").textContent).toBe("5");
  });

  // -------------------------------------------------------------------------
  // removeFromCart
  // -------------------------------------------------------------------------
  it("removeFromCart removes an item from the cart", async () => {
    await act(async () => {
      renderCart();
    });
    await act(async () => {
      screen.getByTestId("add-btn").click();
    });
    expect(screen.getByTestId("cart-length").textContent).toBe("1");

    await act(async () => {
      screen.getByTestId("remove-btn").click();
    });
    expect(screen.getByTestId("cart-length").textContent).toBe("0");
  });

  it("removeFromCart does nothing for an unknown slug", async () => {
    await act(async () => {
      renderCart();
    });
    await act(async () => {
      screen.getByTestId("add-2-btn").click();
    });
    // remove-btn targets product-1, which isn't in the cart
    await act(async () => {
      screen.getByTestId("remove-btn").click();
    });
    expect(screen.getByTestId("cart-length").textContent).toBe("1");
  });

  // -------------------------------------------------------------------------
  // updateQuantity
  // -------------------------------------------------------------------------
  it("updateQuantity changes the quantity of an existing item", async () => {
    await act(async () => {
      renderCart();
    });
    await act(async () => {
      screen.getByTestId("add-btn").click();
    });
    await act(async () => {
      screen.getByTestId("update-qty-btn").click(); // sets qty to 3
    });
    expect(screen.getByTestId("total-items").textContent).toBe("3");
  });

  it("updateQuantity clamps quantity to cartLimit", async () => {
    // Use a custom consumer to test clamping beyond cartLimit
    function ClampConsumer() {
      const { cart, addToCart, updateQuantity, getTotalItems } = useCart();
      return (
        <div>
          <span data-testid="total">{getTotalItems()}</span>
          <button onClick={() => addToCart(makeItem({ cartLimit: 2 }))} data-testid="add" />
          <button onClick={() => updateQuantity("product-1", 10)} data-testid="update" />
        </div>
      );
    }

    await act(async () => {
      render(
        <CartProvider>
          <ClampConsumer />
        </CartProvider>,
      );
    });
    await act(async () => {
      screen.getByTestId("add").click();
    });
    await act(async () => {
      screen.getByTestId("update").click();
    });
    expect(screen.getByTestId("total").textContent).toBe("2"); // clamped to cartLimit
  });

  it("updateQuantity removes item when quantity is 0", async () => {
    await act(async () => {
      renderCart();
    });
    await act(async () => {
      screen.getByTestId("add-btn").click();
    });
    await act(async () => {
      screen.getByTestId("update-zero-btn").click(); // sets qty to 0
    });
    expect(screen.getByTestId("cart-length").textContent).toBe("0");
  });

  it("updateQuantity does nothing for an unknown slug", async () => {
    await act(async () => {
      renderCart();
    });
    await act(async () => {
      screen.getByTestId("update-qty-btn").click(); // product-1 not in cart
    });
    expect(screen.getByTestId("cart-length").textContent).toBe("0");
  });

  // -------------------------------------------------------------------------
  // clearCart
  // -------------------------------------------------------------------------
  it("clearCart empties the cart", async () => {
    await act(async () => {
      renderCart();
    });
    await act(async () => {
      screen.getByTestId("add-btn").click();
      screen.getByTestId("add-2-btn").click();
    });
    expect(screen.getByTestId("cart-length").textContent).toBe("2");

    await act(async () => {
      screen.getByTestId("clear-btn").click();
    });
    expect(screen.getByTestId("cart-length").textContent).toBe("0");
  });

  // -------------------------------------------------------------------------
  // getTotalPrice
  // -------------------------------------------------------------------------
  it("getTotalPrice returns ₹0 for an empty cart", async () => {
    await act(async () => {
      renderCart();
    });
    expect(screen.getByTestId("total-price").textContent).toBe("₹0");
  });

  it("getTotalPrice calculates total across multiple items and quantities", async () => {
    function PriceConsumer() {
      const { addToCart, getTotalPrice } = useCart();
      return (
        <div>
          <span data-testid="price">{getTotalPrice()}</span>
          <button
            onClick={() => {
              addToCart(makeItem({ slug: "p1", price: "₹1,000", quantity: 2, cartLimit: 10 }));
              addToCart(makeItem({ slug: "p2", price: "₹500", quantity: 1, cartLimit: 10 }));
            }}
            data-testid="add-all"
          />
        </div>
      );
    }

    await act(async () => {
      render(
        <CartProvider>
          <PriceConsumer />
        </CartProvider>,
      );
    });
    await act(async () => {
      screen.getByTestId("add-all").click();
    });
    // 1000*2 + 500*1 = 2500
    expect(screen.getByTestId("price").textContent).toBe("₹2,500");
  });

  // -------------------------------------------------------------------------
  // getTotalItems
  // -------------------------------------------------------------------------
  it("getTotalItems returns the sum of all item quantities", async () => {
    await act(async () => {
      renderCart();
    });
    await act(async () => {
      screen.getByTestId("add-btn").click(); // qty 1
      screen.getByTestId("add-btn").click(); // qty 2
      screen.getByTestId("add-2-btn").click(); // qty 1
    });
    expect(screen.getByTestId("total-items").textContent).toBe("3");
  });

  // -------------------------------------------------------------------------
  // Server sync (logged-in user)
  // -------------------------------------------------------------------------
  it("fetches server cart and merges with local cart on login", async () => {
    const localItem = makeItem({ slug: "local", quantity: 1, cartLimit: 5 });
    localStorage.setItem("cart", JSON.stringify([localItem]));

    const serverItem = makeItem({ slug: "server", quantity: 2, cartLimit: 5 });
    mockFetchUserCart.mockResolvedValue({ cart: [serverItem] });
    mockSaveUserCart.mockResolvedValue({ message: "OK", cart: [serverItem, localItem] });
    mockUseAuth.mockReturnValue({ isLoggedIn: true, isAuthLoading: false } as ReturnType<typeof useAuth>);

    await act(async () => {
      renderCart();
    });

    await act(async () => {
      // Let any pending state updates settle
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(mockFetchUserCart).toHaveBeenCalled();
  });
});
