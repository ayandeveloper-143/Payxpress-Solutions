import { Download, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePurchased } from "@/context/PurchasedContext";
import { products } from "@/data/products";

const OrdersPage = () => {
  const { purchasedItems } = usePurchased();

  const orders = purchasedItems
    .map((purchased) => {
      const product = products.find((p) => p.slug === purchased.slug);
      if (!product) return null;
      return { product, purchasedAt: purchased.purchasedAt };
    })
    .filter((entry): entry is { product: (typeof products)[number]; purchasedAt: string } => entry !== null);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <Navbar />

      <main className="container-main pt-28 pb-16 space-y-10">
        {/* Header */}
        <ScrollReveal className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">My Orders</p>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight">Order History</h1>
          <p className="text-muted-foreground text-sm">
            View all your purchased products and download them below.
          </p>
        </ScrollReveal>

        {/* Orders Grid */}
        {orders.length === 0 ? (
          <ScrollReveal className="flex flex-col items-center justify-center py-24 space-y-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <ShoppingBag size={36} className="text-muted-foreground" />
            </div>
            <p className="text-base font-semibold text-foreground">No purchases yet</p>
            <p className="text-sm text-muted-foreground">You haven&apos;t purchased any products yet.</p>
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 mt-2">
              <Link to="/products">Browse Products</Link>
            </Button>
          </ScrollReveal>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map(({ product, purchasedAt }, index) => (
              <ScrollReveal key={product.slug} delay={index * 70}>
                <div className="group border rounded-xl overflow-hidden bg-card hover:border-accent/50 transition-colors">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-48 object-cover"
                    loading="lazy"
                  />
                  <div className="p-5 space-y-3">
                    <Badge className="text-xs font-medium bg-accent/10 text-accent border-accent/20">
                      {product.tag}
                    </Badge>
                    <h3 className="font-semibold text-lg">{product.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
                    <p className="text-xs text-muted-foreground font-mono">ID: {product.slug}</p>
                    <div className="flex items-center justify-between pt-2 gap-2">
                      <span className="font-bold text-foreground">Purchased {purchasedAt}</span>
                      <Button
                        size="sm"
                        className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90 active:scale-[0.97] transition-all"
                      >
                        <Download size={14} />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default OrdersPage;
