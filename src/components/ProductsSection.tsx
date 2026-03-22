import ProductCard from "./ProductCard";
import ScrollReveal from "./ScrollReveal";
import { products } from "@/data/products";

const ProductsSection = () => (
  <section id="products" className="section-padding">
    <div className="container-main space-y-12">
      <ScrollReveal className="text-center space-y-3">
        <h2 className="text-3xl sm:text-4xl font-bold">Our Products</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Production-ready scripts and applications built for real-world use.
        </p>
      </ScrollReveal>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((p, i) => (
          <ScrollReveal key={p.title} delay={i * 80}>
            <ProductCard
              slug={p.slug}
              title={p.title}
              description={p.description}
              tag={p.tag}
              price={p.price}
              image={p.image}
            />
          </ScrollReveal>
        ))}
      </div>
    </div>
  </section>
);

export default ProductsSection;
