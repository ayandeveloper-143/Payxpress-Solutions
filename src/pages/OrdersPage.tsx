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

        {/* Orders List */}
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
          <div className="space-y-4">
            {orders.map(({ product, purchasedAt }, index) => (
              <ScrollReveal key={product.slug} delay={index * 70}>
                <Link to={`/products/${product.slug}`} className="block group border rounded-xl overflow-hidden bg-card hover:border-accent/50 transition-colors flex flex-col sm:flex-row cursor-pointer">
                  <div className="w-full h-48 sm:w-44 sm:h-auto shrink-0 overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover object-center"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4 sm:p-5 space-y-2 flex-1 min-w-0">
                    <Badge className="text-xs font-medium bg-accent/10 text-accent border-accent/20">
                      {product.tag}
                    </Badge>
                    <h3 className="font-semibold text-base sm:text-lg">{product.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between pt-1 gap-2">
                      <span className="text-xs text-muted-foreground">Purchased {purchasedAt}</span>
                      <Button
                        size="sm"
                        className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90 active:scale-[0.97] transition-all shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download size={14} />
                        Download
                      </Button>
                    </div>
                  </div>
                </Link>
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
