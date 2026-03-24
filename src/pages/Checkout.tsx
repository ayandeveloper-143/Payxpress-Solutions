import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { handleCashfreePayment } from "@/lib/payment";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const paymentGatewayEnabled = import.meta.env.VITE_PAYMENT_GATEWAY_ENABLED !== "false";

const checkoutSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

const Checkout = () => {
  const { cart, getTotalPrice } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

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

  // Early return after all hooks
  if (cart.length === 0) {
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
    try {
      setIsProcessing(true);

      // Calculate total amount in INR for Cashfree order creation.
      const totalAmount = cart.reduce((acc, item) => {
        const price = parseFloat(item.price.replace("₹", "").replace(",", ""));
        return acc + price * item.quantity;
      }, 0);

      const orderId = `ORDER_${Date.now()}`;
      const customerId = `CUST_${Date.now()}`;

      // Call Cashfree payment
      const result = await handleCashfreePayment({
        orderId,
        customerId,
        customerName: values.name,
        customerEmail: values.email,
        customerPhone: values.phone,
        orderAmount: totalAmount,
        orderCurrency: "INR",
        orderNote: `Order by ${values.name}`,
      });

      if (result.success) {
      } else {
        toast({
          title: "Payment Failed",
          description: result.message || "Payment was not completed",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Checkout failed",
        variant: "destructive",
      });
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
                              <Input placeholder="John Doe" {...field} />
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
                                <Input placeholder="you@example.com" type="email" {...field} />
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

                  <Button
                    type="submit"
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90 py-6 text-base"
                    disabled={isProcessing || !paymentGatewayEnabled}
                  >
                    {isProcessing ? "Processing..." : paymentGatewayEnabled ? "Proceed to Payment" : "Payment Unavailable"}
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
                        ₹{(parseFloat(item.price.replace("₹", "").replace(",", "")) * item.quantity).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{getTotalPrice()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium text-muted-foreground">Free</span>
                  </div>
                </div>

                <div className="border-t pt-4 flex items-center justify-between">
                  <span className="text-base font-semibold">Total</span>
                  <span className="text-xl font-bold text-foreground">{getTotalPrice()}</span>
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
