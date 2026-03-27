import { useState } from "react";
import { Archive, Calendar, CreditCard, Download, Package, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type OrderStatus = "Completed" | "Processing" | "Pending";

interface Order {
  id: number;
  orderId: string;
  productName: string;
  productTag: string;
  date: string;
  amount: string;
  status: OrderStatus;
  paymentMethod: string;
  hasDownload: boolean;
}

const mockOrders: Order[] = [
  {
    id: 1,
    orderId: "ORD-2024-8821",
    productName: "Multi-Vendor E-Commerce Platform",
    productTag: "E-Commerce",
    date: "12 Jan 2024",
    amount: "₹4,999",
    status: "Completed",
    paymentMethod: "UPI",
    hasDownload: true,
  },
  {
    id: 2,
    orderId: "ORD-2024-8955",
    productName: "CRM & Client Portal System",
    productTag: "CRM",
    date: "28 Feb 2024",
    amount: "₹9,499",
    status: "Completed",
    paymentMethod: "Credit Card",
    hasDownload: true,
  },
  {
    id: 3,
    orderId: "ORD-2024-9103",
    productName: "Inventory & Billing Management",
    productTag: "ERP",
    date: "05 Apr 2024",
    amount: "₹2,999",
    status: "Completed",
    paymentMethod: "Net Banking",
    hasDownload: true,
  },
  {
    id: 4,
    orderId: "ORD-2024-9348",
    productName: "Healthcare Appointment Booking System",
    productTag: "Healthcare",
    date: "19 Jun 2024",
    amount: "₹7,499",
    status: "Processing",
    paymentMethod: "UPI",
    hasDownload: false,
  },
  {
    id: 5,
    orderId: "ORD-2024-9601",
    productName: "Restaurant POS & Order Management",
    productTag: "POS",
    date: "03 Sep 2024",
    amount: "₹14,999",
    status: "Completed",
    paymentMethod: "Debit Card",
    hasDownload: true,
  },
  {
    id: 6,
    orderId: "ORD-2025-0012",
    productName: "Real Estate Listing & Lead Portal",
    productTag: "Real Estate",
    date: "11 Jan 2025",
    amount: "₹5,999",
    status: "Pending",
    paymentMethod: "UPI",
    hasDownload: false,
  },
];

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  Completed: { label: "Completed", className: "bg-green-100 text-green-700" },
  Processing: { label: "Processing", className: "bg-orange-100 text-orange-700" },
  Pending: { label: "Pending", className: "bg-yellow-100 text-yellow-700" },
};

const filterOptions: { value: string; label: string }[] = [
  { value: "All", label: "All Orders" },
  { value: "Completed", label: "Completed" },
  { value: "Processing", label: "Processing" },
  { value: "Pending", label: "Pending" },
];

const OrdersPage = () => {
  const [filter, setFilter] = useState("All");

  const filtered =
    filter === "All" ? mockOrders : mockOrders.filter((o) => o.status === filter);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <Navbar />

      <main className="container-main pt-28 pb-16 space-y-10">
        {/* Header */}
        <ScrollReveal className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">My Orders</p>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight">Order History</h1>
          <p className="text-muted-foreground text-sm">
            View all your purchases, download products and projects.
          </p>
        </ScrollReveal>

        {/* Filter Bar */}
        <ScrollReveal className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
            {filtered.length === 1 ? "order" : "orders"} found
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFilter(opt.value)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium border transition-colors ${
                  filter === opt.value
                    ? "bg-accent text-accent-foreground border-accent"
                    : "border-border text-muted-foreground hover:border-accent hover:text-accent bg-background"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* Orders List */}
        {filtered.length === 0 ? (
          <ScrollReveal className="flex flex-col items-center justify-center py-24 space-y-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <ShoppingBag size={36} className="text-muted-foreground" />
            </div>
            <p className="text-base font-semibold text-foreground">No orders found</p>
            <p className="text-sm text-muted-foreground">You haven&apos;t placed any orders yet.</p>
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 mt-2">
              <Link to="/products">Browse Products</Link>
            </Button>
          </ScrollReveal>
        ) : (
          <div className="space-y-4">
            {filtered.map((order, index) => {
              const status = statusConfig[order.status];
              return (
                <ScrollReveal key={order.id} delay={index * 60}>
                  <div className="rounded-2xl border bg-card p-5 hover:shadow-md transition-shadow">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Product info */}
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-muted">
                          <Package size={24} className="text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground text-sm sm:text-base leading-snug line-clamp-2">
                            {order.productName}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="inline-flex items-center rounded-full bg-accent/10 border border-accent/20 px-2.5 py-0.5 text-xs font-medium text-accent">
                              {order.productTag}
                            </span>
                            <span className="text-xs text-muted-foreground">{order.orderId}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Status + Price */}
                      <div className="flex-shrink-0 text-right space-y-1">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}
                        >
                          {status.label}
                        </span>
                        <p className="text-base font-bold text-foreground">{order.amount}</p>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Bottom row */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      {/* Date + Payment */}
                      <div className="flex flex-wrap items-center gap-4">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar size={13} />
                          {order.date}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CreditCard size={13} />
                          {order.paymentMethod}
                        </span>
                      </div>

                      {/* Download actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1.5 border-accent text-accent hover:bg-accent/10"
                          disabled={!order.hasDownload}
                        >
                          <Download size={13} />
                          Download Product
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1.5 border-accent text-accent hover:bg-accent/10"
                          disabled={!order.hasDownload}
                        >
                          <Archive size={13} />
                          Download Project
                        </Button>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default OrdersPage;
