import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

interface ProductCardProps {
  slug: string;
  title: string;
  description: string;
  tag: string;
  price: string;
  image: string;
}

const ProductCard = ({ slug, title, description, tag, price, image }: ProductCardProps) => {
  const navigate = useNavigate();

  const openProduct = () => {
    navigate(`/products/${slug}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openProduct();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openProduct}
      onKeyDown={handleKeyDown}
      className="group cursor-pointer border rounded-xl overflow-hidden bg-card hover:border-accent/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label={`Open ${title} details`}
    >
      <img src={image} alt={title} className="w-full h-48 object-cover" loading="lazy" />
      <div className="p-5 space-y-3">
        <Badge className="text-xs font-medium bg-accent/10 text-accent border-accent/20">{tag}</Badge>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        <div className="flex items-center justify-between pt-2">
          <span className="font-bold text-foreground">{price}</span>
          <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 active:scale-[0.97] transition-all">
            <Link to={`/products/${slug}`}>View Details</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
