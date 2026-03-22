import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getProductBySlug, products } from "@/data/products";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";

const ProductDetails = () => {
    const { slug } = useParams();

    if (!slug) {
        return <Navigate to="/" replace />;
    }

    const product = getProductBySlug(slug);
    const screenshotsRef = useRef<HTMLDivElement | null>(null);
    const [activeScreenshot, setActiveScreenshot] = useState<string | null>(null);

    if (!product) {
        return <Navigate to="/404" replace />;
    }

    const scrollScreenshots = (direction: "left" | "right") => {
        if (!screenshotsRef.current) {
            return;
        }

        const amount = screenshotsRef.current.clientWidth * 0.8;
        screenshotsRef.current.scrollBy({
            left: direction === "left" ? -amount : amount,
            behavior: "smooth",
        });
    };

    const suggestedProducts = products
        .filter((item) => item.slug !== product.slug)
        .sort((a, b) => {
            const aScore = a.tag === product.tag ? 1 : 0;
            const bScore = b.tag === product.tag ? 1 : 0;
            return bScore - aScore;
        })
        .slice(0, 3);

    return (
        <div className="min-h-screen overflow-x-hidden bg-background">
            <Navbar />
            <main className="container-main pt-28 pb-16 space-y-16">
                <section className="grid gap-10 lg:grid-cols-2 lg:gap-14 items-start">
                    <button
                        type="button"
                        className="w-full max-h-[460px] rounded-2xl border overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        onClick={() => setActiveScreenshot(product.image)}
                        aria-label={`Open ${product.title} main image`}
                    >
                        <img
                            src={product.image}
                            alt={product.title}
                            className="w-full max-h-[460px] object-cover transition-transform duration-300 hover:scale-[1.02]"
                        />
                    </button>

                    <div className="space-y-5">
                        <Badge className="text-xs font-medium bg-accent/10 text-accent border-accent/20">
                            {product.tag}
                        </Badge>
                        <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{product.title}</h1>
                        <p className="text-muted-foreground leading-relaxed">{product.overview}</p>

                        <div className="text-lg font-semibold">
                            Starting at <span className="text-foreground">{product.price}</span>
                        </div>

                        <p className="text-sm text-muted-foreground bg-muted/50 border rounded-lg px-4 py-3">
                            {product.shortNote}
                        </p>

                        <div className="flex flex-wrap gap-3 pt-3">
                            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                                <Link to="/contact">Buy Now</Link>
                            </Button>
                            <Button asChild variant="outline">
                                <Link to="/products">Back to Products</Link>
                            </Button>
                        </div>
                    </div>
                </section>
                <section className="space-y-5">
                    <h2 className="text-2xl sm:text-3xl font-semibold">Product Screenshots</h2>

                    <div className="relative">
                        <div
                            ref={screenshotsRef}
                            className="flex gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth pb-1"
                        >
                            {product.screenshots.map((screenshot, index) => (
                                <button
                                    key={`${product.slug}-${index}`}
                                    type="button"
                                    className="w-[88%] sm:w-[64%] lg:w-[46%] h-64 sm:h-72 rounded-xl border shrink-0 snap-start overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    onClick={() => setActiveScreenshot(screenshot)}
                                    aria-label={`Open screenshot ${index + 1}`}
                                >
                                    <img
                                        src={screenshot}
                                        alt={`${product.title} screenshot ${index + 1}`}
                                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                                        loading="lazy"
                                    />
                                </button>
                            ))}
                        </div>

                        <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="hidden sm:inline-flex absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full shadow-md"
                            onClick={() => scrollScreenshots("left")}
                            aria-label="Previous screenshots"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="hidden sm:inline-flex absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full shadow-md"
                            onClick={() => scrollScreenshots("right")}
                            aria-label="Next screenshots"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </section>


                <section className="space-y-5">
                    <h2 className="text-2xl sm:text-3xl font-semibold">Description</h2>
                    <p className="text-muted-foreground leading-relaxed max-w-4xl">{product.fullDescription}</p>

                    <div className="space-y-2">
                        <h3 className="font-semibold text-lg">Key Features</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            {product.features.map((feature) => (
                                <li key={feature} className="flex items-start gap-2">
                                    <span className="mt-[7px] size-1.5 rounded-full bg-accent" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                <section className="space-y-5">
                    <h2 className="text-2xl sm:text-3xl font-semibold">Suggested Products</h2>
                    <p className="text-muted-foreground">You may also like these products.</p>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {suggestedProducts.map((suggestion) => (
                            <Link
                                key={suggestion.slug}
                                to={`/products/${suggestion.slug}`}
                                className="group border rounded-xl overflow-hidden bg-card hover:border-accent/50 transition-colors"
                            >
                                <img
                                    src={suggestion.image}
                                    alt={suggestion.title}
                                    className="w-full h-44 object-cover"
                                    loading="lazy"
                                />
                                <div className="p-4 space-y-2">
                                    <Badge className="text-xs font-medium bg-accent/10 text-accent border-accent/20">
                                        {suggestion.tag}
                                    </Badge>
                                    <h3 className="font-semibold leading-snug">{suggestion.title}</h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {suggestion.description}
                                    </p>
                                    <div className="text-sm font-semibold text-foreground">{suggestion.price}</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>


            </main>

            <Dialog open={Boolean(activeScreenshot)} onOpenChange={(open) => !open && setActiveScreenshot(null)}>
                <DialogContent className="max-w-5xl p-2 sm:p-3 border-0 bg-transparent shadow-none">
                    <DialogTitle className="sr-only">Screenshot Preview</DialogTitle>
                    {activeScreenshot ? (
                        <img
                            src={activeScreenshot}
                            alt={`${product.title} preview`}
                            className="w-full max-h-[80vh] object-contain rounded-lg"
                        />
                    ) : null}
                </DialogContent>
            </Dialog>

            <Footer />
        </div>
    );
};

export default ProductDetails;
