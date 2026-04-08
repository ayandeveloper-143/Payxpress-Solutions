import { ShoppingBag } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useRef, useState } from "react";
import { usePurchased } from "@/context/PurchasedContext";
import { products } from "@/data/products";
import { useToast } from "@/hooks/use-toast";
import { downloadProductFile } from "@/lib/download";
import { format } from "date-fns";

const orderLoadingSkeletons = Array.from({ length: 3 }, (_, index) => `order-loading-${index}`);

const OrdersPage = () => {
  const { isLoggedIn, isAuthLoading, refreshUser } = useAuth();
  // Refresh order history on navigation/visibility
  // Only refresh on first mount and when tab becomes visible (not on every render)
  const didInitial = useRef(false);
  useEffect(() => {
    if (!didInitial.current) {
      refreshUser?.();
      didInitial.current = true;
    }
    // Only refresh on mount, not on tab visibility change
  }, [refreshUser]);
  const { purchasedItems } = usePurchased();
  const { toast } = useToast();

  if (!isAuthLoading && !isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  const [downloadingSlug, setDownloadingSlug] = useState<string | null>(null);

  const handleDownload = async (
    event: React.MouseEvent<HTMLButtonElement>,
    productSlug: string,
    productTitle: string
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setDownloadingSlug(productSlug);
    try {
      toast({
        title: "Download started",
        description: `${productTitle} is being prepared for download.`,
      });
      await downloadProductFile(productSlug);
      toast({
        title: "Download Ready",
        description: `${productTitle} download started!`,
      });
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: error?.message || "Could not download file.",
        variant: "destructive",
      });
    } finally {
      setDownloadingSlug(null);
    }
  };

  const orders = purchasedItems.map((purchased) => {
    const product = products.find((p) => p.slug === purchased.slug) ?? null;
    return { slug: purchased.slug, product, purchasedAt: purchased.purchasedAt };
  });

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
        {isAuthLoading ? (
          <div className="space-y-4" aria-label="Loading order history">
            {orderLoadingSkeletons.map((key) => (
              <div
                key={key}
                className="block border rounded-xl overflow-hidden bg-card transition-colors flex flex-col sm:flex-row"
              >
                <Skeleton className="w-full h-48 sm:w-44 sm:h-auto shrink-0 rounded-none" />
                <div className="p-4 sm:p-5 space-y-2 flex-1 min-w-0">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <div className="flex items-center justify-between pt-1 gap-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-9 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
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
            {orders.map(({ slug, product, purchasedAt }, index) => (
              <ScrollReveal key={slug} delay={index * 70}>
                {product ? (
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
                        <span className="text-xs text-muted-foreground">
                          {purchasedAt ? format(new Date(purchasedAt), "dd MMM yyyy, hh:mm a") : ""}
                        </span>
                        <Button
                          size="sm"
                          className="bg-accent text-accent-foreground hover:bg-accent/90 active:scale-[0.97] transition-all shrink-0"
                          onClick={(event) => handleDownload(event, product.slug, product.title)}
                          isLoading={downloadingSlug === product.slug}
                          disabled={downloadingSlug !== null && downloadingSlug !== product.slug}
                        >
                          Download
                        </Button>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="block border rounded-xl overflow-hidden bg-card flex flex-col sm:flex-row">
                    <div className="w-full h-48 sm:w-44 sm:h-auto shrink-0 overflow-hidden bg-muted flex items-center justify-center">
                      <ShoppingBag size={36} className="text-muted-foreground" />
                    </div>
                    <div className="p-4 sm:p-5 space-y-2 flex-1 min-w-0">
                      <Badge className="text-xs font-medium bg-muted text-muted-foreground border-muted">
                        Product
                      </Badge>
                      <h3 className="font-semibold text-base sm:text-lg truncate">{slug}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">This product is no longer listed in the catalog.</p>
                      <div className="flex items-center justify-between pt-1 gap-2">
                        <span className="text-xs text-muted-foreground">
                          {purchasedAt ? format(new Date(purchasedAt), "dd MMM yyyy, hh:mm a") : ""}
                        </span>
                        <Button
                          size="sm"
                          className="bg-accent text-accent-foreground hover:bg-accent/90 active:scale-[0.97] transition-all shrink-0"
                          onClick={(event) => handleDownload(event, slug, slug)}
                          isLoading={downloadingSlug === slug}
                          disabled={downloadingSlug !== null && downloadingSlug !== slug}
                        >
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
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
