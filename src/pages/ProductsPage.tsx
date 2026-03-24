import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import ScrollReveal from "@/components/ScrollReveal";
import { Badge } from "@/components/ui/badge";
import { products as fallbackProducts } from "@/data/products";
import { fetchProducts } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const categories = ["SaaS", "E-commerce", "Automation"];

const ProductsPage = () => {
    const { data } = useQuery({
        queryKey: ["products"],
        queryFn: fetchProducts,
    });

    const products = data?.products ?? fallbackProducts;

    return (
        <div className="min-h-screen overflow-x-hidden bg-background">
            <Navbar />

            <main className="container-main pt-28 pb-16 space-y-16">

                <section className="grid lg:grid-cols-2 gap-10 items-center">
                    <ScrollReveal className="space-y-4">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Products</p>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight max-w-2xl">
                            Ready-to-deploy software products built for growth and performance.
                        </h1>
                        <p className="text-muted-foreground leading-relaxed max-w-2xl">
                            Explore our production-grade solutions for billing, sales, automation, and operations. Every product is
                            designed for real teams with practical workflows and clear business outcomes.
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1">
                            {categories.map((category) => (
                                <Badge key={category} className="text-xs px-3 py-1 bg-accent/10 text-accent border-accent/20">
                                    {category}
                                </Badge>
                            ))}
                        </div>
                    </ScrollReveal>


                </section>
                <section className="space-y-6">
                    <h2 className="text-2xl sm:text-3xl font-semibold">All Products</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map((product, index) => (
                            <ScrollReveal key={product.slug} delay={index * 70}>
                                <ProductCard
                                    slug={product.slug}
                                    title={product.title}
                                    description={product.description}
                                    tag={product.tag}
                                    price={product.price}
                                    image={product.image}
                                />
                            </ScrollReveal>
                        ))}
                    </div>
                </section>

            </main>

            <Footer />
        </div>
    );
};

export default ProductsPage;
