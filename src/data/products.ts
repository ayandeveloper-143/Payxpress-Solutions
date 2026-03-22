export interface Product {
    slug: string;
    title: string;
    description: string;
    tag: string;
    price: string;
    image: string;
    overview: string;
    shortNote: string;
    fullDescription: string;
    screenshots: string[];
    features: string[];
}

export const products: Product[] = [
    {
        slug: "invoice-management-system",
        title: "Invoice Management System",
        description: "Automated invoicing with multi-currency support and client portal.",
        tag: "SaaS",
        price: "₹6,999",
        image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&h=700&fit=crop",
        overview:
            "A full invoicing workflow for teams that need to bill globally, track payment statuses, and reduce manual accounting work.",
        shortNote: "Best for agencies and service businesses handling recurring invoices.",
        fullDescription:
            "Invoice Management System helps teams create branded invoices, automate follow-ups, and track collections from one dashboard. It reduces manual finance work while giving clients a clean portal to view and pay invoices on time.",
        screenshots: [
            "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&h=700&fit=crop",
            "https://images.unsplash.com/photo-1543286386-2e659306cd6c?w=1200&h=700&fit=crop",
            "https://images.unsplash.com/photo-1556742393-d75f468bfcb0?w=1200&h=700&fit=crop",
            "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=1200&h=700&fit=crop",
        ],
        features: [
            "Multi-currency invoice generation",
            "Branded client portal with payment history",
            "Recurring invoice schedules and reminders",
            "Export-ready reports for accounting",
        ],
    },
    {
        slug: "ecommerce-starter-kit",
        title: "E-commerce Starter Kit",
        description: "Full-featured online store with payment gateway integration.",
        tag: "E-commerce",
        price: "₹7,999",
        image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=700&fit=crop",
        overview:
            "Launch online stores faster with a modern storefront, cart and checkout flow, and payment integrations already wired.",
        shortNote: "Perfect for startups that need to launch a store quickly.",
        fullDescription:
            "E-commerce Starter Kit provides a production-ready shopping flow with product pages, secure checkout, and order tracking. It includes all key storefront modules so your team can focus on branding and sales growth instead of rebuilding basics.",
        screenshots: [
            "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=700&fit=crop",
            "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&h=700&fit=crop",
            "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1200&h=700&fit=crop",
            "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200&h=700&fit=crop",
        ],
        features: [
            "Product catalog and inventory management",
            "Secure checkout with major gateways",
            "Order tracking dashboard",
            "Marketing-ready discount and coupon support",
        ],
    },
    {
        slug: "task-automation-engine",
        title: "Task Automation Engine",
        description: "Schedule and automate repetitive workflows with a visual builder.",
        tag: "Automation",
        price: "₹6,499",
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=700&fit=crop",
        overview:
            "Design internal automations with a no-code style workflow builder and connect common business tools in minutes.",
        shortNote: "Ideal for teams removing repetitive manual operations.",
        fullDescription:
            "Task Automation Engine allows businesses to map and run workflows automatically with flexible triggers and conditions. It gives operations teams visibility into every step while reducing delays and human error in daily processes.",
        screenshots: [
            "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=700&fit=crop",
            "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=700&fit=crop",
            "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&h=700&fit=crop",
            "https://images.unsplash.com/photo-1516321165247-4aa89a48be28?w=1200&h=700&fit=crop",
        ],
        features: [
            "Drag-and-drop automation builder",
            "Event-based triggers and conditions",
            "Task queue and execution logs",
            "Built-in notifications for failed runs",
        ],
    },
    {
        slug: "crm-dashboard",
        title: "CRM Dashboard",
        description: "Customer relationship management with analytics and reporting.",
        tag: "SaaS",
        price: "Contact",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=700&fit=crop",
        overview:
            "Unify contacts, deals, and activity timelines in one dashboard built for sales and account teams.",
        shortNote: "Built for growing sales teams that need clean visibility.",
        fullDescription:
            "CRM Dashboard centralizes contacts, leads, meetings, and pipeline analytics in one interface. It helps teams prioritize opportunities and improve close rates with accurate reports and activity tracking.",
        screenshots: [
            "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=700&fit=crop",
            "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=700&fit=crop",
            "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200&h=700&fit=crop",
            "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&h=700&fit=crop",
        ],
        features: [
            "Lead and opportunity pipeline management",
            "Customer activity timelines",
            "Team performance analytics",
            "Customizable reporting widgets",
        ],
    },
    {
        slug: "chat-support-widget",
        title: "Chat Support Widget",
        description: "Embeddable live chat with AI-powered auto responses.",
        tag: "Automation",
        price: "₹6,299",
        image: "https://images.unsplash.com/photo-1611746872915-64382b5c76da?w=1200&h=700&fit=crop",
        overview:
            "Deploy support chat on any website with smart auto-replies, routing rules, and agent handoff.",
        shortNote: "Strong fit for businesses offering live support at scale.",
        fullDescription:
            "Chat Support Widget can be embedded on any website to handle first-line support instantly. With AI-assisted responses and human handoff, your team can improve response times without increasing staffing costs.",
        screenshots: [
            "https://images.unsplash.com/photo-1611746872915-64382b5c76da?w=1200&h=700&fit=crop",
            "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=700&fit=crop",
            "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=700&fit=crop",
            "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&h=700&fit=crop",
        ],
        features: [
            "Website-ready embeddable widget",
            "AI-assisted first response",
            "Conversation routing and tagging",
            "Agent dashboard with transcript history",
        ],
    },
    {
        slug: "booking-platform",
        title: "Booking Platform",
        description: "Appointment scheduling with calendar sync and payments.",
        tag: "SaaS",
        price: "₹7,499",
        image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=1200&h=700&fit=crop",
        overview:
            "Let customers self-book appointments while your team manages availability, reminders, and payment collection.",
        shortNote: "Great for clinics, consultants, and service-based teams.",
        fullDescription:
            "Booking Platform makes appointment management simple with real-time availability, automatic reminders, and payment collection. It reduces booking friction for customers and keeps your schedule optimized.",
        screenshots: [
            "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=1200&h=700&fit=crop",
            "https://images.unsplash.com/photo-1463256329860-4006f67b9e90?w=1200&h=700&fit=crop",
            "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&h=700&fit=crop",
            "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1200&h=700&fit=crop",
        ],
        features: [
            "Calendar sync across major providers",
            "Service-based booking configuration",
            "Automated confirmation and reminder flow",
            "Prepaid booking and cancellation controls",
        ],
    },
];

export const getProductBySlug = (slug: string) =>
    products.find((product) => product.slug === slug);
