import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { useCart } from "@/context/CartContext";
import { getProductBySlug, products as fallbackProducts } from "@/data/products";
import { useToast } from "@/hooks/use-toast";
import { fetchProductBySlug, fetchProducts } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";

const ProductDetails = () => {
    const { slug } = useParams();

    if (!slug) {
        return <Navigate to="/" replace />;
    }

    const productQuery = useQuery({
        queryKey: ["product", slug],
        queryFn: () => fetchProductBySlug(slug),
    });

    const productsQuery = useQuery({
        queryKey: ["products"],
        queryFn: fetchProducts,
    });

    const product = productQuery.data?.product ?? getProductBySlug(slug);
    const products = productsQuery.data?.products ?? fallbackProducts;
    const screenshotsRef = useRef<HTMLDivElement | null>(null);
    const [activeScreenshot, setActiveScreenshot] = useState<string | null>(null);
    const [checkoutSheetOpen, setCheckoutSheetOpen] = useState(false);
    const { cart, addToCart, updateQuantity, removeFromCart, getTotalItems, getTotalPrice } = useCart();
    const { toast } = useToast();

    if (!product && (productQuery.isLoading || productQuery.isFetching)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
                Loading product details...
            </div>
        );
    }

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

    const addCurrentProductToCart = () => {
        if (currentProductQuantity >= product.cartLimit) {
            toast({
                title: "Cart limit reached",
                description: `You can add only ${product.cartLimit} unit${product.cartLimit > 1 ? "s" : ""} of ${product.title}.`,
            });
            return false;
        }

        addToCart({
            slug: product.slug,
            title: product.title,
            price: product.price,
            image: product.image,
            quantity: 1,
            cartLimit: product.cartLimit,
        });

        return true;
    };

    const handleAddToCart = () => {
        if (!addCurrentProductToCart()) {
            return;
        }

        toast({
            title: "Added to Cart",
            description: `${product.title} has been added to your cart`,
        });
    };

    const handleBuyNow = () => {
        if (currentProductQuantity >= product.cartLimit) {
            setCheckoutSheetOpen(true);
            return;
        }

        if (!addCurrentProductToCart()) {
            return;
        }

        setCheckoutSheetOpen(true);
        toast({
            title: "Ready for Checkout",
            description: `${product.title} is added. You can continue checkout from side menu.`,
        });
    };

    const preventCloseOnToastClick = (event: Event) => {
        const target = event.target as HTMLElement | null;
        if (!target) return;

        if (target.closest(".toast-viewport") || target.closest(".toaster")) {
            event.preventDefault();
        }
    };

    const currentProductQuantity = cart.find((item) => item.slug === product.slug)?.quantity ?? 0;

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
                            <Button
                                type="button"
                                className="bg-accent text-accent-foreground hover:bg-accent/90"
                                onClick={handleBuyNow}
                            >
                                Buy Now
                            </Button>
                            <Button type="button" variant="outline" onClick={handleAddToCart} className="relative" disabled={currentProductQuantity >= product.cartLimit}>
                                Add to Cart
                                {currentProductQuantity > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-[10px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
                                        {currentProductQuantity}
                                    </span>
                                )}
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

            <Sheet open={checkoutSheetOpen} onOpenChange={setCheckoutSheetOpen}>
                <SheetContent
                    side="right"
                    className="w-full sm:max-w-md p-0"
                    onInteractOutside={preventCloseOnToastClick}
                >
                    <div className="h-full flex flex-col">
                        <SheetHeader className="p-6 border-b">
                            <SheetTitle>Checkout</SheetTitle>
                            <SheetDescription>
                                {getTotalItems() > 0
                                    ? `${getTotalItems()} item${getTotalItems() > 1 ? "s" : ""} in your cart`
                                    : "Your cart is empty"}
                            </SheetDescription>
                        </SheetHeader>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {cart.length === 0 ? (
                                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                                    Add products to continue checkout.
                                </div>
                            ) : (
                                cart.map((item) => (
                                    <div key={item.slug} className="flex items-start gap-3 rounded-lg border p-3">
                                        <img src={item.image} alt={item.title} className="h-16 w-14 rounded-md object-cover" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                                                <p className="text-sm font-semibold text-destructive whitespace-nowrap">{item.price}</p>
                                            </div>

                                            <div className="mt-2 flex items-center gap-3">
                                                <div className="inline-flex items-center rounded-md border h-9">
                                                    <button
                                                        type="button"
                                                        className="h-full w-9 text-base font-semibold text-muted-foreground hover:text-foreground"
                                                        onClick={() => updateQuantity(item.slug, item.quantity - 1)}
                                                    >
                                                        -
                                                    </button>
                                                    <span className="h-full min-w-10 border-x px-3 text-sm flex items-center justify-center">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className="h-full w-9 text-base font-semibold text-muted-foreground hover:text-foreground"
                                                        onClick={() => updateQuantity(item.slug, item.quantity + 1)}
                                                        disabled={item.quantity >= item.cartLimit}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="text-sm text-muted-foreground underline-offset-2 hover:underline"
                                                    onClick={() => removeFromCart(item.slug)}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="border-t p-6 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Total</span>
                                <span className="text-base font-semibold text-foreground">{getTotalPrice()}</span>
                            </div>
                            <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={cart.length === 0}>
                                <Link to="/checkout">Proceed to Checkout</Link>
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            <Footer />
        </div>
    );
};

export default ProductDetails;
