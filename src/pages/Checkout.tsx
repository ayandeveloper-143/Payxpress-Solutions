import { useEffect, useRef, useState } from "react";
import { apiBaseUrl, storePodAgreement } from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { consumeStoredCreateOrderResponse, getStoredCreateOrderResponse } from "@/lib/checkout-bridge";
import { handlePayment } from "@/lib/payment";
import type { PaymentResult } from "@/lib/payment";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const checkoutSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, getTotalPrice, syncCartToServer } = useCart();
  const [breakdown, setBreakdown] = useState(null);
  const [storedCreateOrder, setStoredCreateOrder] = useState(() => getStoredCreateOrderResponse());
  const storedPaymentAttemptedRef = useRef(false);

  // Fetch breakdown for current cart (not just after submit)
  useEffect(() => {
    if (cart.length === 0) {
      setBreakdown(null);
      return;
    }
    const fetchBreakdown = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/cart/breakdown`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cart }),
        });
        if (res.ok) {
          setBreakdown(await res.json());
        } else {
          setBreakdown(null);
        }
      } catch {
        setBreakdown(null);
      }
    };
    fetchBreakdown();
  }, [cart]);
  const { user, isAuthLoading, isLoggedIn } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [agreedToTnc, setAgreedToTnc] = useState(false);

  const redirectTo = (path: string) => {
    window.location.href = path;
  };

  const finalizePaymentResult = (result: PaymentResult) => {
    if (result.success === true && result.orderId) {
      if (user) {
        storePodAgreement({
          userUuid: user.id,
          userEmail: user.email,
          orderId: result.orderId,
        }).catch((err) => console.warn("[pod] Failed to store agreement:", err));
      }

      redirectTo(`/payment-success?order_id=${encodeURIComponent(result.orderId)}&gateway=${encodeURIComponent(result.gateway ?? "cashfree")}`);
      return;
    }

    const orderIdParam = result.orderId ? `?order_id=${encodeURIComponent(result.orderId)}` : "";
    redirectTo(`/payment-failed${orderIdParam}`);
  };

  // Device-aware login redirect/popup
  useEffect(() => {
    if (!isAuthLoading && !isLoggedIn && !localStorage.getItem("auth_token")) {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        navigate("/auth", { replace: true });
      } else {
        // Show login popup/modal (to be implemented)
        window.dispatchEvent(new CustomEvent("show-login-popup"));
      }
    }
  }, [isAuthLoading, isLoggedIn, navigate]);

  useEffect(() => {
    if (!storedCreateOrder || storedPaymentAttemptedRef.current) {
      return;
    }

    storedPaymentAttemptedRef.current = true;
    const cachedOrder = consumeStoredCreateOrderResponse();

    if (!cachedOrder) {
      setStoredCreateOrder(null);
      return;
    }

    const openStoredPayment = async () => {
      try {
        setIsProcessing(true);
        const result = await handlePayment({ createOrderResponse: cachedOrder });

        if (result.success === true && result.orderId) {
          finalizePaymentResult(result);
        } else {
          redirectTo(`/payment-failed?order_id=${encodeURIComponent(cachedOrder.orderId)}`);
        }
      } catch (error) {
        redirectTo(`/payment-failed?order_id=${encodeURIComponent(cachedOrder.orderId)}`);
      } finally {
        setStoredCreateOrder(null);
        setIsProcessing(false);
      }
    };

    openStoredPayment();
  }, [storedCreateOrder, navigate]);

  // Always call hooks at the top level
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: "",
      address: "",
    },
  });

  // Sync form with user data when available
  useEffect(() => {
    if (user) {
      form.setValue("name", user.name || "");
      form.setValue("email", user.email || "");
    }
  }, [user, form]);

  // Early return after all hooks
  if (cart.length === 0 && !storedCreateOrder) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-20">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold mb-4">Cart is Empty</h1>
          <p className="text-muted-foreground mb-8">Add products to checkout</p>
          <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link to="/products">Go to Products</Link>
          </Button>
        </div>
      </div>
    );
  }

  const onSubmit = async (values: CheckoutFormValues) => {
    if (!agreedToTnc) {
      toast({
        title: "Agreement Required",
        description: "Please agree to the delivery terms before proceeding.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);

      // Always sync cart to server before payment (prevents empty cart bug)
      await syncCartToServer();

      // Call the unified payment handler (gateway is determined by backend)
      const result = await handlePayment({
        phone: values.phone,
        address: values.address?.trim() || undefined,
      });
      finalizePaymentResult(result);
    } catch (error) {
      redirectTo("/payment-failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <Navbar />

      <main className="container-main px-4 py-8 pt-24 pb-14">
        <div className="mx-auto max-w-5xl">
          <Link to="/products" className="mb-6 inline-flex items-center gap-2 text-accent hover:underline font-medium">
            <ArrowLeft size={16} /> Back to Products
          </Link>

          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
              <p className="text-sm text-muted-foreground mt-1">Complete your details and proceed securely to payment.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground w-fit">
              <ShieldCheck size={14} className="text-accent" /> Secure checkout
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-7">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} readOnly={isLoggedIn} className={isLoggedIn ? "bg-muted cursor-not-allowed" : ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="you@example.com" type="email" {...field} readOnly={isLoggedIn} className={isLoggedIn ? "bg-muted cursor-not-allowed" : ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input placeholder="9876543210" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="123 Main St, City, State, ZIP" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Proof of Delivery Agreement */}
                  <div className="rounded-2xl border bg-card p-5 shadow-sm">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreedToTnc}
                        onChange={(e) => setAgreedToTnc(e.target.checked)}
                        className="mt-1 h-4 w-4 shrink-0 rounded border-border accent-accent"
                      />
                      <span className="text-sm text-muted-foreground leading-relaxed">
                        I understand that all products sold are{" "}
                        <strong className="text-foreground">digital goods</strong>. By completing this
                        purchase and downloading the digital assets, I acknowledge that delivery has been
                        completed. Downloading the files constitutes acceptance of delivery and I
                        confirm I am satisfied with the purchase.{" "}
                        <a href="/terms-conditions" target="_blank" className="text-accent underline underline-offset-2">
                          Terms & Conditions
                        </a>
                        .
                      </span>
                    </label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90 py-6 text-base"
                    disabled={isProcessing || !agreedToTnc}
                  >
                    {isProcessing ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin" size={20} />
                        Processing...
                      </span>
                    ) : "Proceed to Payment"}
                  </Button>
                </form>
              </Form>
            </div>

            <aside className="lg:col-span-1">
              <div className="rounded-2xl border bg-card p-6 shadow-sm sticky top-24 space-y-4">
                <h2 className="text-xl font-semibold">Order Summary</h2>

                <div className="border-t pt-4 space-y-3 max-h-64 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div key={item.slug} className="flex justify-between gap-3 text-sm">
                      <span className="text-muted-foreground leading-snug">
                        {item.title} x {item.quantity}
                      </span>
                      <span className="font-medium whitespace-nowrap">
                        {item.price === "₹0" ? "Custom" : `₹${(parseFloat(item.price.replace("₹", "").replace(",", "")) * item.quantity).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  {breakdown === null ? (
                    <>
                      <Skeleton className="h-6 w-2/3 mb-2" />
                      <Skeleton className="h-6 w-2/3 mb-2" />
                      <Skeleton className="h-6 w-2/3 mb-2" />
                      <Skeleton className="h-8 w-1/2" />
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Price (incl. GST & fees)</span>
                        <span className="font-medium">₹{breakdown.price?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">GST included ({breakdown.gstPercent}%)</span>
                        <span className="font-medium">₹{breakdown.gstIncluded?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Gateway Fee ({breakdown.gatewayFeePercent}%)</span>
                        <span className="font-medium">₹{breakdown.gatewayFee?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span className="font-medium text-muted-foreground">Free</span>
                      </div>
                      <div className="border-t pt-4 flex items-center justify-between">
                        <span className="text-base font-semibold">Total</span>
                        <span className="text-xl font-bold text-foreground">₹{breakdown.total?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
