import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ScrollReveal from "@/components/ScrollReveal";

const returnSections = [
    {
        title: "1. Scope of Return Policy",
        detail:
            "This Return Policy applies to eligible products sold by PayXpress Solutions where return support is explicitly offered in the product listing, invoice, or agreement.",
    },
    {
        title: "2. Digital Products and Services",
        detail:
            "Digital products, downloadable items, source code, license keys, and custom development services are generally non-returnable once delivered or accessed.",
    },
    {
        title: "3. Return Eligibility",
        detail:
            "A return request may be considered only when the product delivered is materially different from the confirmed order, corrupted beyond use, or inaccessible due to a verified seller-side issue that cannot be resolved.",
    },
    {
        title: "4. Non-Eligible Return Cases",
        detail:
            "Returns are not accepted for change-of-mind requests, compatibility issues disclosed before purchase, customer-side setup errors, or issues caused by unauthorized modifications.",
    },
    {
        title: "5. Return Request Window",
        detail:
            "Return requests must be submitted within 7 days of delivery unless a different period is stated in your service agreement.",
    },
    {
        title: "6. Review and Resolution",
        detail:
            "Before approving a return, we may provide troubleshooting, replacement files, or corrected delivery. If unresolved and eligible, we will confirm next steps by email.",
    },
    {
        title: "7. Relationship to Refund Policy",
        detail:
            "Where a return cannot be completed and eligibility is confirmed, any refund outcome is handled under our Refund Policy terms.",
    },
    {
        title: "8. Policy Updates",
        detail:
            "We may update this Return Policy to reflect service changes or legal requirements. The latest version is posted on this page.",
    },
];

const ReturnPolicy = () => (
    <div className="min-h-screen overflow-x-hidden bg-background">
        <Navbar />

        <main className="container-main pt-28 pb-16 space-y-12">
            <ScrollReveal className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Legal</p>
                <h1 className="text-3xl sm:text-4xl font-bold">Return Policy</h1>
                <p className="text-muted-foreground">Last updated: March 22, 2026</p>
            </ScrollReveal>

            <ScrollReveal className="max-w-5xl border rounded-2xl p-6 sm:p-8 bg-card text-sm sm:text-base text-muted-foreground leading-relaxed">
                <p>
                    Please review this Return Policy before purchasing. Return approval depends on product type, order terms, and
                    verification of the issue reported.
                </p>
            </ScrollReveal>

            <div className="grid gap-6 max-w-5xl">
                {returnSections.map((section, index) => (
                    <ScrollReveal key={section.title} delay={index * 40} className="border rounded-xl p-6 bg-card space-y-2">
                        <h2 className="text-foreground font-semibold text-lg">{section.title}</h2>
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{section.detail}</p>
                    </ScrollReveal>
                ))}
            </div>

            <ScrollReveal className="max-w-5xl border rounded-2xl p-6 sm:p-8 bg-muted/40 space-y-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
                <h2 className="text-foreground font-semibold text-lg">Return Support</h2>
                <p>
                    For return-related requests, contact
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

export default ReturnPolicy;