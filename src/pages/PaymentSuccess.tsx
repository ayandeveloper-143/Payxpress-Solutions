import { Link } from "react-router-dom";
import { CheckCircle2, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const PaymentSuccess = () => {
    return (
        <div className="min-h-screen overflow-x-hidden bg-background">
            <Navbar />

            <main className="container-main px-4 py-12 pt-28 pb-16">
                <div className="mx-auto max-w-2xl">
                    <div className="rounded-3xl border bg-card p-8 shadow-sm sm:p-10">
                        <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
                            <CheckCircle2 size={30} />
                        </div>

                        <h1 className="text-3xl font-bold tracking-tight">Payment Successful</h1>
                        <p className="mt-3 text-muted-foreground">
                            Thank you for your order. Your payment was completed successfully.
                        </p>

                        <div className="mt-6 rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2 text-foreground">
                                <PackageCheck size={16} />
                                <span className="font-medium">What happens next?</span>
                            </div>
                            <p className="mt-2">
                                Our team will process your order details and you can track updates from your account orders section.
                            </p>
                        </div>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                                <Link to="/orders">View Orders</Link>
                            </Button>
                            <Button asChild variant="outline">
                                <Link to="/products">Continue Shopping</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default PaymentSuccess;
