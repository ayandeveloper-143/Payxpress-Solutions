import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
  const cartQuantity = cart.find((item) => item.slug === slug)?.quantity ?? 0;
  const isCartLimitReached = cartQuantity >= cartLimit;

  const openProduct = () => {
    navigate(`/products/${slug}`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (cartQuantity >= cartLimit) {
      toast({
        title: "Cart limit reached",
        description: `You can add only ${cartLimit} unit${cartLimit > 1 ? "s" : ""} of ${title}.`,
      });
      return;
    }

    addToCart({
      slug,
      title,
      price,
      image,
      quantity: 1,
      cartLimit,
    });
    toast({
      title: "Added to Cart",
      description: `${title} has been added to your cart`,
    });
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
          <span className="font-bold text-foreground">{price}</span>
          <div className="flex gap-2">
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
            <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 active:scale-[0.97] transition-all">
              <Link to={`/products/${slug}`}>Details</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
