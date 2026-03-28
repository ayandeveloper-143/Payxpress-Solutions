import ProductCard from "./ProductCard";
import ScrollReveal from "./ScrollReveal";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchProducts } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const loadingSkeletons = Array.from({ length: 6 }, (_, index) => `home-product-loading-${index}`);

const ProductsSection = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const products = data?.products ?? [];

  return (
    <section id="products" className="section-padding">
      <div className="container-main space-y-12">
        <ScrollReveal className="text-center space-y-3">
          <h2 className="text-3xl sm:text-4xl font-bold">Our Products</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Production-ready scripts and applications built for real-world use.
          </p>
        </ScrollReveal>
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingSkeletons.map((key) => (
              <div key={key} className="border rounded-xl overflow-hidden bg-card">
                <Skeleton className="h-48 w-full rounded-none" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <div className="flex items-center justify-between pt-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-9 w-9 rounded-md" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <p className="text-sm text-muted-foreground text-center">Unable to load products right now.</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center">No products available yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p, i) => (
              <ScrollReveal key={p.slug} delay={i * 80}>
                <ProductCard
                  slug={p.slug}
                  title={p.title}
                  description={p.description}
                  tag={p.tag}
                  price={p.price}
                  image={p.image}
                  cartLimit={p.cartLimit}
                />
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductsSection;
