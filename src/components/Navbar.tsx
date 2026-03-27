import { useEffect, useRef, useState, useMemo } from "react";
import { Menu, X, ShoppingCart, LogOut, Search, UserCircle, Package } from "lucide-react";
import { products } from "@/data/products";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const links = [
  { label: "Home", to: "/" },
  { label: "Products", to: "/products" },
  { label: "Services", to: "/services" },
  { label: "Custom", to: "/custom-solutions" },
  { label: "About Us", to: "/about" },
  { label: "Contact", to: "/contact" },
];

type AuthFormType = "login" | "signup" | "forgot";
const bannerStorageKey = "development-banner-hidden";
const checkoutIntentStorageKey = "pending-checkout-after-login";

const Navbar = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [cartSheetOpen, setCartSheetOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authFormType, setAuthFormType] = useState<AuthFormType>("login");
  const [bannerVisible, setBannerVisible] = useState(true);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const { cart, getTotalItems, getTotalPrice, removeFromCart, updateQuantity, clearCart } = useCart();
  const { isLoggedIn, user, logout } = useAuth();
  const cartItems = getTotalItems();
  const [searchSheetOpen, setSearchSheetOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hiddenBanner = window.localStorage.getItem(bannerStorageKey) === "true";
    setBannerVisible(!hiddenBanner);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    if (profileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileMenuOpen]);

  const handleLogout = () => {
    setLogoutConfirmOpen(true);
  };

  const confirmLogout = () => {
    logout();
    clearCart();
    setOpen(false);
    setLogoutConfirmOpen(false);
  };

  const openAuthPopup = (form: AuthFormType = "login", options?: { preserveCheckoutIntent?: boolean }) => {
    if (!options?.preserveCheckoutIntent) {
      window.sessionStorage.removeItem(checkoutIntentStorageKey);
    }
    setAuthFormType(form);
    setAuthDialogOpen(true);
  };

  const handleAuthSuccess = () => {
    const shouldRedirectToCheckout = window.sessionStorage.getItem(checkoutIntentStorageKey) === "true";
    if (shouldRedirectToCheckout) {
      window.sessionStorage.removeItem(checkoutIntentStorageKey);
      setCartSheetOpen(false);
      setOpen(false);
      setAuthDialogOpen(false);
      setAuthFormType("login");
      navigate("/checkout");
      return;
    }

    setAuthDialogOpen(false);
    setAuthFormType("login");
  };

  const closeBanner = () => {
    setBannerVisible(false);
    window.localStorage.setItem(bannerStorageKey, "true");
  };

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tag.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  const renderSearchPanel = () => (
    <div className="h-full flex flex-col">
      <SheetHeader className="p-6 border-b">
        <SheetTitle>Search</SheetTitle>
        <SheetDescription>Find products and services</SheetDescription>
      </SheetHeader>
      <div className="px-6 pt-5">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="What are you looking for?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-2 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            autoFocus
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 pt-4 space-y-3 pb-6">
        {searchQuery.trim() === "" ? (
          <p className="text-sm text-muted-foreground text-center mt-8">Start typing to search products…</p>
        ) : searchResults.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center mt-8">No products found for &ldquo;{searchQuery}&rdquo;</p>
        ) : (
          searchResults.map((product) => (
            <Link
              key={product.slug}
              to={`/products/${product.slug}`}
              onClick={() => { setSearchSheetOpen(false); setSearchQuery(""); }}
              className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted transition-colors"
            >
              <img src={product.image} alt={product.title} className="h-14 w-12 rounded-md object-cover flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">{product.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{product.tag}</p>
                <p className="mt-1 text-sm font-semibold text-accent">{product.price}</p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );

  const renderCartPanel = () => (
    <div className="h-full flex flex-col">
      <SheetHeader className="p-6 border-b">
        <SheetTitle>Cart</SheetTitle>
        <SheetDescription>
          {cartItems > 0 ? `${cartItems} item${cartItems > 1 ? "s" : ""} in your cart` : "Your cart is empty"}
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {cart.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Add products to see them here.
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.slug} className="flex items-start gap-3 rounded-lg border p-3">
              <img src={item.image} alt={item.title} className="h-16 w-14 rounded-md object-cover" />

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                  </div>
                  <p className="text-sm font-semibold text-destructive whitespace-nowrap">{item.price}</p>
                </div>

                <div className="mt-2 flex items-center gap-3">
                  <div className="inline-flex items-center rounded-md border h-9">
                    <button
                      type="button"
                      className="h-full w-9 text-base font-semibold text-muted-foreground hover:text-foreground"
                      onClick={() => updateQuantity(item.slug, item.quantity - 1)}
                    >
                      -
                    </button>
                    <span className="h-full min-w-10 border-x px-3 text-sm flex items-center justify-center">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="h-full w-9 text-base font-semibold text-muted-foreground hover:text-foreground"
                      onClick={() => updateQuantity(item.slug, item.quantity + 1)}
                      disabled={item.quantity >= item.cartLimit}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className="text-sm text-muted-foreground underline-offset-2 hover:underline"
                    onClick={() => removeFromCart(item.slug)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t p-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-base font-semibold text-foreground">{getTotalPrice()}</span>
        </div>
        {isLoggedIn ? (
          <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={cart.length === 0}>
            <Link to="/checkout">Proceed to Checkout</Link>
          </Button>
        ) : (
          <Button
            type="button"
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            disabled={cart.length === 0}
            onClick={() => {
              window.sessionStorage.setItem(checkoutIntentStorageKey, "true");
              setCartSheetOpen(false);
              openAuthPopup("login", { preserveCheckoutIntent: true });
            }}
          >
            Proceed to Checkout
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {bannerVisible && (
        <div className="fixed top-0 z-[60] w-full bg-red-600 text-white">
          <div className="container-main flex h-8 items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.18em]">
            <span>Development Phase</span>
            <button
              type="button"
              onClick={closeBanner}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full text-white/90 transition hover:bg-white/15 hover:text-white"
              aria-label="Close development banner"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <nav
        className={cn(
          "fixed z-50 w-full border-b",
          bannerVisible ? "top-8" : "top-0",
          open ? "bg-white border-border" : "bg-background/95 backdrop-blur-sm border-border",
        )}
      >
        <div className="container-main flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <img src="/logo.png" alt="PayXpress logo" className="h-12 w-auto" />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {/* Search */}
            <Button
              variant="outline"
              size="icon"
              className="text-foreground border-border hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
              onClick={() => setSearchSheetOpen(true)}
            >
              <Search size={20} />
            </Button>

            {/* Cart */}
            <Button
              variant="outline"
              size="icon"
              className="relative text-foreground border-border hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
              onClick={() => setCartSheetOpen(true)}
            >
              <ShoppingCart size={20} />
              {cartItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItems}
                </span>
              )}
            </Button>

            {/* Profile or Login */}
            {isLoggedIn ? (
              <div className="relative" ref={profileRef}>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-foreground border-border hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                  onClick={() => setProfileMenuOpen((prev) => !prev)}
                >
                  <UserCircle size={20} />
                </Button>
                {profileMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-border bg-background shadow-xl z-[100] overflow-hidden animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150">
                    <Link
                      to="/account"
                      onClick={() => setProfileMenuOpen(false)}
                      className="block px-4 py-3 border-b hover:bg-muted transition-colors"
                    >
                      <p className="text-sm font-semibold text-foreground">{user?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </Link>
                    <div className="p-2 flex flex-col gap-0.5">
                      <Link
                        to="/orders"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        <Package size={16} />
                        Order History
                      </Link>
                      <button
                        type="button"
                        onClick={() => { setProfileMenuOpen(false); handleLogout(); }}
                        className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Button
                type="button"
                className="bg-accent text-accent-foreground hover:bg-accent/90 active:scale-[0.97] transition-all"
                onClick={() => openAuthPopup("login")}
              >
                Login
              </Button>
            )}
          </div>

          <div className="md:hidden flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSearchSheetOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
            >
              <Search size={20} />
            </button>
            {isLoggedIn && (
              <button
                type="button"
                onClick={() => navigate("/account")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
              >
                <UserCircle size={20} />
              </button>
            )}
            <button onClick={() => setOpen(!open)} className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground">
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        <div
          className={cn(
            "md:hidden border-t bg-background px-4 overflow-hidden transition-all duration-300 ease-out",
            open ? "max-h-[520px] opacity-100 translate-y-0 pb-4 pt-2" : "max-h-0 opacity-0 -translate-y-1 pb-0 pt-0 pointer-events-none",
          )}
          aria-hidden={!open}
        >
          <div className="space-y-1">
            {links.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                onClick={() => setOpen(false)}
                className="block w-full text-left py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
            {isLoggedIn && (
              <Link
                to="/orders"
                onClick={() => setOpen(false)}
                className="block w-full text-left py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Order History
              </Link>
            )}

            {/* Bottom action row */}
            <div className="flex gap-2 pt-2 border-t mt-1">
              <Button
                variant="outline"
                className="flex-1 text-foreground border-border hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 relative"
                onClick={() => { setOpen(false); setCartSheetOpen(true); }}
              >
                <ShoppingCart size={16} className="mr-2" />
                Cart {cartItems > 0 && `(${cartItems})`}
              </Button>
              {isLoggedIn ? (
                <Button
                  variant="outline"
                  onClick={() => { setOpen(false); handleLogout(); }}
                  className="flex-1 text-destructive border-destructive/50 hover:bg-destructive/10"
                >
                  <LogOut size={16} className="mr-2" />
                  Logout
                </Button>
              ) : (
                <Link to="/auth" onClick={() => setOpen(false)} className="flex-1">
                  <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        <Sheet open={searchSheetOpen} onOpenChange={(open) => { setSearchSheetOpen(open); if (!open) setSearchQuery(""); }}>
          <SheetContent side="right" className="w-full sm:max-w-md p-0">
            {renderSearchPanel()}
          </SheetContent>
        </Sheet>

        <Sheet open={cartSheetOpen} onOpenChange={setCartSheetOpen}>
          <SheetContent side="right" className="w-full sm:max-w-md p-0">
            {renderCartPanel()}
          </SheetContent>
        </Sheet>

        <Dialog
          open={authDialogOpen}
          onOpenChange={(nextOpen) => {
            setAuthDialogOpen(nextOpen);
            if (!nextOpen) {
              window.sessionStorage.removeItem(checkoutIntentStorageKey);
            }
          }}
        >
          <DialogContent className="w-[94vw] max-w-md border-0 bg-transparent p-0 shadow-none">
            <DialogTitle className="sr-only">Authentication</DialogTitle>
            <div key={authFormType} className="auth-form-enter">
              {authFormType === "login" && (
                <LoginForm
                  onSuccess={handleAuthSuccess}
                  onShowSignup={() => setAuthFormType("signup")}
                  onShowForgot={() => setAuthFormType("forgot")}
                />
              )}
              {authFormType === "signup" && (
                <SignupForm
                  onSuccess={handleAuthSuccess}
                  onToggleForm={() => setAuthFormType("login")}
                />
              )}
              {authFormType === "forgot" && (
                <ForgotPasswordForm
                  onSuccess={() => setAuthFormType("login")}
                  onToggleForm={() => setAuthFormType("login")}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </nav>

      {/* Logout Confirmation Popup */}
      {logoutConfirmOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setLogoutConfirmOpen(false)}
          />
          <div className="relative z-10 w-[90vw] max-w-sm rounded-2xl border border-border bg-background p-6 shadow-2xl">
            <div className="mb-1 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <LogOut size={20} className="text-destructive" />
              </div>
              <h2 className="text-base font-semibold text-foreground">Logout</h2>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Are you sure you want to log out of your account?
            </p>
            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setLogoutConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={confirmLogout}
              >
                Yes, Logout
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
