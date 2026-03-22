import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ScrollReveal from "@/components/ScrollReveal";

const cancelSections = [
    {
        title: "1. Scope of Cancellation Policy",
        detail:
            "This Cancellation Policy explains when and how an order or service request may be canceled before completion.",
    },
    {
        title: "2. Cancellation Before Work Starts",
        detail:
            "Orders may be canceled before work begins or before delivery processing starts, subject to verification and confirmation by our support team.",
    },
    {
        title: "3. Cancellation After Work Starts",
        detail:
            "If project work, setup, provisioning, or delivery has already started, cancellation may be limited and any completed portion may remain billable.",
    },
    {
        title: "4. Subscription and Recurring Services",
        detail:
            "For recurring services, cancellation stops future billing cycles when submitted before the next renewal date. Current active periods are generally non-cancelable.",
    },
    {
        title: "5. Non-Cancelable Cases",
        detail:
            "Completed deliveries, issued license keys, delivered digital files, and fully executed custom development milestones are not eligible for cancellation.",
    },
    {
        title: "6. How to Request Cancellation",
        detail:
            "To request cancellation, provide your full name, order reference, purchase email, and reason for cancellation through our official support email.",
    },
    {
        title: "7. Review Timeline",
        detail:
            "We review cancellation requests as quickly as possible and usually respond within 1 to 3 business days depending on order complexity and verification requirements.",
    },
    {
        title: "8. Relation to Refund Policy",
        detail:
            "Cancellation approval does not automatically mean a refund. Any refund outcome is determined under our Refund Policy terms.",
    },
    {
        title: "9. Policy Updates",
        detail:
            "We may revise this policy from time to time. The latest version is always available on this page with an updated effective date.",
    },
];

const CancelPolicy = () => (
    <div className="min-h-screen overflow-x-hidden bg-background">
        <Navbar />

        <main className="container-main pt-28 pb-16 space-y-12">
            <ScrollReveal className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Legal</p>
                <h1 className="text-3xl sm:text-4xl font-bold">Cancel Policy</h1>
                <p className="text-muted-foreground">Last updated: March 22, 2026</p>
            </ScrollReveal>

            <ScrollReveal className="max-w-5xl border rounded-2xl p-6 sm:p-8 bg-card text-sm sm:text-base text-muted-foreground leading-relaxed">
                <p>
                    Please review this policy carefully before placing an order. Cancellation eligibility depends on whether
                    delivery or project execution has started.
                </p>
            </ScrollReveal>

            <div className="grid gap-6 max-w-5xl">
                {cancelSections.map((section, index) => (
                    <ScrollReveal key={section.title} delay={index * 40} className="border rounded-xl p-6 bg-card space-y-2">
                        <h2 className="text-foreground font-semibold text-lg">{section.title}</h2>
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{section.detail}</p>
                    </ScrollReveal>
                ))}
            </div>

            <ScrollReveal className="max-w-5xl border rounded-2xl p-6 sm:p-8 bg-muted/40 space-y-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
                <h2 className="text-foreground font-semibold text-lg">Cancellation Support</h2>
                <p>
                    For cancellation requests, contact
                    <a href="mailto:support@payxpress-solutions.com" className="text-accent hover:underline">
                        {" "}
                        support@payxpress-solutions.com
                    </a>
                    .
                </p>
            </ScrollReveal>
        </main>

        <Footer />
    </div>
);

export default CancelPolicy;