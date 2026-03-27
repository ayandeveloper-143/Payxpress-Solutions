import { Download, ShoppingBag } from "lucide-react";
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
  description: string;
  image: string;
  date: string;
  hasDownload: boolean;
}

const mockOrders: Order[] = [
  {
    id: 1,
    productName: "Multi-Vendor E-Commerce Platform",
    productTag: "E-Commerce",
    description: "Full-featured multi-vendor marketplace with vendor dashboards, product listings, and order management.",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop",
    date: "12 Jan 2024",
    hasDownload: true,
  },
  {
    id: 2,
    productName: "CRM & Client Portal System",
    productTag: "CRM",
    description: "Manage leads, clients, and pipelines with a clean portal for customer communication and tracking.",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop",
    date: "28 Feb 2024",
    hasDownload: true,
  },
  {
    id: 3,
    productName: "Inventory & Billing Management",
    productTag: "ERP",
    description: "End-to-end inventory tracking, invoicing, and billing system built for small and mid-size businesses.",
    image: "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=800&h=400&fit=crop",
    date: "05 Apr 2024",
    hasDownload: true,
  },
  {
    id: 4,
    productName: "Healthcare Appointment Booking System",
    productTag: "Healthcare",
    description: "Online appointment scheduling platform for clinics and hospitals with patient and doctor portals.",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=400&fit=crop",
    date: "19 Jun 2024",
    hasDownload: false,
  },
  {
    id: 5,
    productName: "Restaurant POS & Order Management",
    productTag: "POS",
    description: "Point-of-sale and order management system designed for restaurants, cafes, and food businesses.",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=400&fit=crop",
    date: "03 Sep 2024",
    hasDownload: true,
  },
  {
    id: 6,
    productName: "Real Estate Listing & Lead Portal",
    productTag: "Real Estate",
    description: "Property listing platform with lead capture, agent dashboards, and enquiry management tools.",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=400&fit=crop",
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
                  <img
                    src={order.image}
                    alt={order.productName}
                    className="w-full h-48 object-cover"
                    loading="lazy"
                  />
                  <div className="p-5 space-y-3">
                    <Badge className="text-xs font-medium bg-accent/10 text-accent border-accent/20">
                      {order.productTag}
                    </Badge>
                    <h3 className="font-semibold text-lg">{order.productName}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{order.description}</p>
                    <div className="flex items-center justify-between pt-2 gap-2">
                      <span className="font-bold text-foreground">Purchased {order.date}</span>
                      <Button
                        size="sm"
                        className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90 active:scale-[0.97] transition-all"
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
