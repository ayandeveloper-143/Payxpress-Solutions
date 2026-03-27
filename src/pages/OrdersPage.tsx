import { Calendar, Download, Package, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Order {
  id: number;
  productName: string;
  productTag: string;
  date: string;
  hasDownload: boolean;
}

const mockOrders: Order[] = [
  {
    id: 1,
    productName: "Multi-Vendor E-Commerce Platform",
    productTag: "E-Commerce",
    date: "12 Jan 2024",
    hasDownload: true,
  },
  {
    id: 2,
    productName: "CRM & Client Portal System",
    productTag: "CRM",
    date: "28 Feb 2024",
    hasDownload: true,
  },
  {
    id: 3,
    productName: "Inventory & Billing Management",
    productTag: "ERP",
    date: "05 Apr 2024",
    hasDownload: true,
  },
  {
    id: 4,
    productName: "Healthcare Appointment Booking System",
    productTag: "Healthcare",
    date: "19 Jun 2024",
    hasDownload: false,
  },
  {
    id: 5,
    productName: "Restaurant POS & Order Management",
    productTag: "POS",
    date: "03 Sep 2024",
    hasDownload: true,
  },
  {
    id: 6,
    productName: "Real Estate Listing & Lead Portal",
    productTag: "Real Estate",
    date: "11 Jan 2025",
    hasDownload: false,
  },
];

const OrdersPage = () => {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <Navbar />

      <main className="container-main pt-28 pb-16 space-y-10">
        {/* Header */}
        <ScrollReveal className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">My Orders</p>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight">Order History</h1>
          <p className="text-muted-foreground text-sm">
            View all your purchased products and download them below.
          </p>
        </ScrollReveal>

        {/* Orders Grid */}
        {mockOrders.length === 0 ? (
          <ScrollReveal className="flex flex-col items-center justify-center py-24 space-y-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <ShoppingBag size={36} className="text-muted-foreground" />
            </div>
            <p className="text-base font-semibold text-foreground">No purchases yet</p>
            <p className="text-sm text-muted-foreground">You haven&apos;t purchased any products yet.</p>
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 mt-2">
              <Link to="/products">Browse Products</Link>
            </Button>
          </ScrollReveal>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockOrders.map((order, index) => (
              <ScrollReveal key={order.id} delay={index * 70}>
                <div className="group border rounded-xl overflow-hidden bg-card hover:border-accent/50 transition-colors">
                  {/* Product image placeholder */}
                  <div className="flex h-48 w-full items-center justify-center bg-muted">
                    <Package size={48} className="text-muted-foreground/40" />
                  </div>

                  {/* Card body */}
                  <div className="p-5 space-y-3">
                    <Badge className="text-xs font-medium bg-accent/10 text-accent border-accent/20">
                      {order.productTag}
                    </Badge>
                    <h3 className="font-semibold text-base leading-snug line-clamp-2">
                      {order.productName}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar size={13} />
                      <span>Purchased on {order.date}</span>
                    </div>

                    <div className="pt-2">
                      <Button
                        size="sm"
                        className="w-full gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90"
                        disabled={!order.hasDownload}
                      >
                        <Download size={14} />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default OrdersPage;
