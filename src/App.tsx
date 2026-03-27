import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { PurchasedProvider } from "@/context/PurchasedContext";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import ProductDetails from "./pages/ProductDetails.tsx";
import AboutUs from "./pages/AboutUs.tsx";
import ServicesPage from "./pages/ServicesPage.tsx";
import ContactUs from "./pages/ContactUs.tsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.tsx";
import TermsConditions from "./pages/TermsConditions.tsx";
import CookiePolicy from "./pages/CookiePolicy.tsx";
import RefundPolicy from "./pages/RefundPolicy.tsx";
import ReturnPolicy from "./pages/ReturnPolicy.tsx";
import CancelPolicy from "./pages/CancelPolicy.tsx";
import ProductsPage from "./pages/ProductsPage.tsx";
import CustomSolutionsPage from "./pages/CustomSolutionsPage.tsx";
import Auth from "./pages/Auth.tsx";
import Checkout from "./pages/Checkout.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import AccountPage from "./pages/AccountPage.tsx";
import OrdersPage from "./pages/OrdersPage.tsx";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const elementId = decodeURIComponent(location.hash.replace("#", ""));
      const element = document.getElementById(elementId);

      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname, location.hash]);

  return (
    <div key={`${location.pathname}${location.hash}`} className="page-enter">
      <Routes location={location}>
        <Route path="/" element={<Index />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:slug" element={<ProductDetails />} />
        <Route path="/custom-solutions" element={<CustomSolutionsPage />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-conditions" element={<TermsConditions />} />
        <Route path="/cookie-policy" element={<CookiePolicy />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/return-policy" element={<ReturnPolicy />} />
        <Route path="/cancel-policy" element={<CancelPolicy />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
              <PurchasedProvider>
                <AppRoutes />
              </PurchasedProvider>
            </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
