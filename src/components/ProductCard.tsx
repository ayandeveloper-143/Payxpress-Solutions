import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { usePurchased } from "@/context/PurchasedContext";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { downloadProductFile } from "@/lib/download";
import { ShoppingCart } from "lucide-react";

interface ProductCardProps {
  slug: string;
  title: string;
  description: string;
  tag: string;
  price: string;
  image: string;
  cartLimit: number;
}

const ProductCard = ({ slug, title, description, tag, price, image, cartLimit }: ProductCardProps) => {
  const navigate = useNavigate();
  const { cart, addToCart } = useCart();
  const { isPurchased, getPurchasedCount } = usePurchased();
  // const { toast } = useToast();
  const purchasedCount = getPurchasedCount(slug);
  const effectiveCartLimit = Math.max(0, cartLimit - purchasedCount);
  const cartQuantity = cart.find((item) => item.slug === slug)?.quantity ?? 0;
  const isCartLimitReached = effectiveCartLimit <= 0 || cartQuantity >= effectiveCartLimit;
  const purchased = isPurchased(slug);

  const openProduct = () => {
    navigate(`/products/${slug}`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (cartQuantity >= effectiveCartLimit) {
      return;
    }

    const wasAdded = addToCart({
      slug,
      title,
      price,
      image,
      quantity: 1,
      cartLimit: effectiveCartLimit,
    });

    if (!wasAdded) {
      return;
    }

    // No cart notification needed
  };

  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();
  const handleDownload = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setIsDownloading(true);
    try {
      toast({
        title: "Download started",
        description: `${title} is being prepared for download.`,
      });
      await downloadProductFile(slug);
      toast({
        title: "Download Ready",
        description: `${title} download started!`,
      });
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: error?.message || "Could not download file.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;

    if (target.closest("button") || target.closest("a")) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openProduct();
    }
  };

  const handleCardClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;

    if (target.closest("button") || target.closest("a")) {
      return;
    }

    openProduct();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className="group cursor-pointer border rounded-xl overflow-hidden bg-card hover:border-accent/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label={`Open ${title} details`}
    >
      <img src={image} alt={title} className="w-full h-48 object-cover" loading="lazy" />
      <div className="p-5 space-y-3">
        <Badge className="text-xs font-medium bg-accent/10 text-accent border-accent/20">{tag}</Badge>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        <div className="flex items-center justify-between pt-2 gap-2">
          <span className="font-bold text-foreground">{price === "₹0" ? "Custom" : price}</span>
          <div className="flex gap-2">
            {purchased && (
              <Button
                size="sm"
                className="bg-accent text-accent-foreground hover:bg-accent/90 active:scale-[0.97] transition-all"
                onClick={handleDownload}
                isLoading={isDownloading}
                disabled={isDownloading}
              >
                Download
              </Button>
            )}
            {effectiveCartLimit > 0 && (
              <>
                <div onClick={(event) => event.stopPropagation()}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="relative text-accent border-accent/50 hover:bg-accent/10 disabled:pointer-events-none"
                    onClick={handleAddToCart}
                    disabled={isCartLimitReached}
                  >
                    <ShoppingCart size={16} />
                    {cartQuantity > 0 && (
                      <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-[10px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
                        {cartQuantity}
                      </span>
                    )}
                  </Button>
                </div>
                {!purchased && (
                  <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 active:scale-[0.97] transition-all">
                    <Link to={`/products/${slug}`}>Details</Link>
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
