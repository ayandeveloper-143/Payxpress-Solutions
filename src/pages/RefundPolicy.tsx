import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ScrollReveal from "@/components/ScrollReveal";

const refundSections = [
    {
        title: "1. General Refund Rule",
        detail:
            "All purchases are final. We do not provide refunds for delivered digital products, completed services, custom development work, project milestones that have been approved, subscription periods that have already started, or change-of-mind requests.",
    },
    {
        title: "2. Core Exception: Product Not Delivered",
        detail:
            "A refund may be issued only if the purchased product is not delivered within the agreed delivery timeline and we are unable to complete delivery after investigation and a reasonable support resolution attempt.",
    },
    {
        title: "3. What Counts as Non-Delivery",
        detail:
            "Non-delivery means you completed payment but did not receive the purchased product, access credentials, download files, or activation details within the committed timeline. This may include failed account provisioning, missing license issuance, or confirmed internal delivery failures.",
    },
    {
        title: "4. What Does Not Count as Non-Delivery",
        detail:
            "The following do not qualify as non-delivery: incorrect contact details provided by the customer, undeliverable inbox settings, delayed customer response to verification requests, rejection caused by customer-side infrastructure, and refusal to follow onboarding steps required for delivery.",
    },
    {
        title: "5. Verification Process",
        detail:
            "To review eligibility, we verify payment confirmation, order metadata, delivery logs, support tickets, communication history, and technical records that may have affected receipt of the product. We may request additional details to complete verification.",
    },
    {
        title: "6. Refund Request Window",
        detail:
            "If your product was not delivered, submit your refund request within 7 days of the expected delivery date. Requests submitted much later may be rejected if required evidence is unavailable or if records cannot be reliably verified.",
    },
    {
        title: "7. How to Request a Refund",
        detail:
            "Send your request with your full name, order reference, payment proof, expected delivery date, and a short explanation of non-delivery. Incomplete requests may delay the review process until all required information is received.",
    },
    {
        title: "8. Resolution First Approach",
        detail:
            "Before issuing a refund, our team may first attempt delivery completion, replacement access, corrected deployment, or secure re-send where appropriate. If delivery still cannot be completed, a refund decision will be made based on verified facts.",
    },
    {
        title: "9. Approved Refund Processing",
        detail:
            "Approved refunds are returned to the original payment method whenever possible. Processing times may vary by payment gateway, card issuer, bank, and regional settlement rules. Any third-party payment processing fees may be non-refundable where permitted by law.",
    },
    {
        title: "10. Chargebacks and Disputes",
        detail:
            "We encourage customers to contact us before opening a payment dispute so we can investigate quickly and provide a documented resolution path. Filing a chargeback without first contacting support may delay or complicate direct resolution.",
    },
    {
        title: "11. Abuse and Fraud Prevention",
        detail:
            "Refund requests that involve misuse, fraudulent evidence, repeated bad-faith claims, or policy manipulation may be denied. We reserve the right to suspend related services while fraud checks are ongoing.",
    },
    {
        title: "12. Policy Updates",
        detail:
            "We may update this Refund Policy from time to time to reflect service improvements, legal requirements, or operational changes. The latest version is always published on this page with an updated effective date.",
    },
];

const RefundPolicy = () => (
    <div className="min-h-screen overflow-x-hidden bg-background">
        <Navbar />

        <main className="container-main pt-28 pb-16 space-y-12">
            <ScrollReveal className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Legal</p>
                <h1 className="text-3xl sm:text-4xl font-bold">Refund Policy</h1>
                <p className="text-muted-foreground">Last updated: March 22, 2026</p>
            </ScrollReveal>

            <ScrollReveal className="max-w-5xl border rounded-2xl p-6 sm:p-8 bg-card text-sm sm:text-base text-muted-foreground leading-relaxed">
                <p>
                    This Refund Policy applies to all purchases made through PayXpress Solutions. Please read it carefully before
                    placing an order.
                </p>
                <p className="mt-4">
                    Our default rule is strict: no refunds for delivered work or delivered products. The only refund exception is
                    verified non-delivery of the purchased product under the conditions described below.
                </p>
            </ScrollReveal>

            <div className="grid gap-6 max-w-5xl">
                {refundSections.map((section, index) => (
                    <ScrollReveal key={section.title} delay={index * 40} className="border rounded-xl p-6 bg-card space-y-2">
                        <h2 className="text-foreground font-semibold text-lg">{section.title}</h2>
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{section.detail}</p>
                    </ScrollReveal>
                ))}
            </div>

            <ScrollReveal className="max-w-5xl border rounded-2xl p-6 sm:p-8 bg-muted/40 space-y-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
                <h2 className="text-foreground font-semibold text-lg">Refund Support</h2>
                <p>
                    For refund requests related to non-delivery, contact
                    <a href="mailto:billing@payxpress-solutions.com" className="text-accent hover:underline">
                        {" "}
                        billing@payxpress-solutions.com
                    </a>
                    .
                </p>
            </ScrollReveal>
        </main>

        <Footer />
    </div>
);

export default RefundPolicy;