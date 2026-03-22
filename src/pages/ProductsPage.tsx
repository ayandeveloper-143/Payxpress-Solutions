import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ScrollReveal from "@/components/ScrollReveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { products } from "@/data/products";
import { Link } from "react-router-dom";

const categories = ["SaaS", "E-commerce", "Automation"];

const ProductsPage = () => (
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

                <ScrollReveal className="border rounded-2xl p-6 bg-muted/40 space-y-4" delay={120}>
                    <h2 className="text-2xl font-semibold">Why Teams Choose Our Products</h2>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <span className="mt-2 size-1.5 rounded-full bg-accent" />
                            <span>Launch fast with proven modules and production architecture.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="mt-2 size-1.5 rounded-full bg-accent" />
                            <span>Lower operational costs with built-in automation and analytics.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="mt-2 size-1.5 rounded-full bg-accent" />
                            <span>Scale confidently with clean code, maintainable structure, and support.</span>
                        </li>
                    </ul>
                </ScrollReveal>
            </section>

            <section className="space-y-6">
                <h2 className="text-2xl sm:text-3xl font-semibold">All Products</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product, index) => (
                        <ScrollReveal key={product.slug} delay={index * 70} className="group border rounded-xl overflow-hidden bg-card hover:border-accent/50 transition-colors">
                            <img src={product.image} alt={product.title} className="w-full h-48 object-cover" loading="lazy" />
                            <div className="p-5 space-y-3">
                                <Badge className="text-xs font-medium bg-accent/10 text-accent border-accent/20">{product.tag}</Badge>
                                <h3 className="font-semibold text-lg leading-snug">{product.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
                                <div className="flex items-center justify-between pt-2">
                                    <span className="font-bold text-foreground">{product.price}</span>
                                    <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                                        <Link to={`/products/${product.slug}`}>View Details</Link>
                                    </Button>
                                </div>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
            </section>
        </main>

        <Footer />
    </div>
);

export default ProductsPage;
