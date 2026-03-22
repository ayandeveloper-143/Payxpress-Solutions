import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface ProductCardProps {
  slug: string;
  title: string;
  description: string;
  tag: string;
  price: string;
  image: string;
}

const ProductCard = ({ slug, title, description, tag, price, image }: ProductCardProps) => (
  <div className="group border rounded-xl overflow-hidden bg-card hover:border-accent/50 transition-colors">
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

export default ProductCard;
