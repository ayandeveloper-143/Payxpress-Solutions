import { useState } from "react";
import { Menu, X, ShoppingCart, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
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

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [cartSheetOpen, setCartSheetOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authFormType, setAuthFormType] = useState<AuthFormType>("login");
  const { cart, getTotalItems, getTotalPrice, removeFromCart, updateQuantity } = useCart();
  const { isLoggedIn, user, logout } = useAuth();
  const cartItems = getTotalItems();

  const handleLogout = () => {
    logout();
    setOpen(false);
  };

  const openAuthPopup = (form: AuthFormType = "login") => {
    setAuthFormType(form);
    setAuthDialogOpen(true);
  };

  const handleAuthSuccess = () => {
    setAuthDialogOpen(false);
    setAuthFormType("login");
  };

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
        <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={cart.length === 0}>
          <Link to="/checkout">Proceed to Checkout</Link>
        </Button>
      </div>
    </div>
  );

  return (
    <nav
      className={cn(
        "fixed top-0 z-50 w-full border-b transition-colors duration-300",
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

        <div className="hidden md:flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="relative text-accent border-accent/50 hover:bg-accent/10"
            onClick={() => setCartSheetOpen(true)}
          >
            <ShoppingCart size={20} />
            {cartItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cartItems}
              </span>
            )}
          </Button>

          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">{user?.name}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={handleLogout}
                className="text-destructive border-destructive/50 hover:bg-destructive/10"
              >
                <LogOut size={20} />
              </Button>
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

        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div
        className={cn(
          "md:hidden border-t bg-background px-4 overflow-hidden transition-all duration-300 ease-out",
          open ? "max-h-[420px] opacity-100 translate-y-0 pb-4 pt-2" : "max-h-0 opacity-0 -translate-y-1 pb-0 pt-0 pointer-events-none",
        )}
        aria-hidden={!open}
      >
        <div className="space-y-2">
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
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              className="flex-1 text-accent border-accent/50 hover:bg-accent/10 relative"
              onClick={() => {
                setOpen(false);
                setCartSheetOpen(true);
              }}
            >
              <ShoppingCart size={16} className="mr-2" />
              Cart {cartItems > 0 && `(${cartItems})`}
            </Button>
            {isLoggedIn ? (
              <Button
                variant="outline"
                onClick={handleLogout}
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

      <Sheet open={cartSheetOpen} onOpenChange={setCartSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0">
          {renderCartPanel()}
        </SheetContent>
      </Sheet>

      <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
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
  );
};

export default Navbar;
