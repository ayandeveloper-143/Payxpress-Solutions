import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ScrollReveal from "@/components/ScrollReveal";

const clauses = [
    {
        title: "1. Acceptance of Terms",
        detail:
            "By accessing this website or engaging our services, you agree to these Terms and Conditions and all applicable laws and regulations.",
    },
    {
        title: "2. Service Scope",
        detail:
            "Project deliverables, timelines, and responsibilities are defined in approved proposals, statements of work, or written agreements. Work outside approved scope may require a separate estimate and approval.",
    },
    {
        title: "3. Client Responsibilities",
        detail:
            "Clients are responsible for providing timely feedback, access credentials, assets, and approvals. Delays in client input may impact project schedules and delivery dates.",
    },
    {
        title: "4. Pricing and Payments",
        detail:
            "Fees are payable according to agreed milestones and invoices. Late or incomplete payment may result in paused work, delayed deliverables, or suspension of support services.",
    },
    {
        title: "5. Change Requests",
        detail:
            "Any feature additions or specification changes requested after scope confirmation may affect timelines and cost, and will be implemented only after written approval.",
    },
    {
        title: "6. Intellectual Property",
        detail:
            "Subject to full payment, ownership of final deliverables transfers to the client unless otherwise agreed. We retain rights to pre-existing tools, frameworks, and reusable components.",
    },
    {
        title: "7. Confidentiality",
        detail:
            "Both parties agree to keep confidential information secure and use it only for project-related purposes, except where disclosure is required by law.",
    },
    {
        title: "8. Warranties and Disclaimers",
        detail:
            "Services are provided in good faith and to professional standards. Except where explicitly stated, no additional warranties are provided for uninterrupted service or third-party platform behavior.",
    },
    {
        title: "9. Limitation of Liability",
        detail:
            "To the maximum extent permitted by law, we are not liable for indirect, incidental, special, or consequential damages, including lost profits or business interruption.",
    },
    {
        title: "10. Termination",
        detail:
            "Either party may terminate engagement under agreed contract terms. Outstanding payments for completed work remain payable upon termination.",
    },
    {
        title: "11. Governing Law",
        detail:
            "These terms are governed by applicable laws of the jurisdiction defined in the relevant service agreement, unless otherwise required by local law.",
    },
    {
        title: "12. Updates to Terms",
        detail:
            "We may revise these terms periodically. Continued use of the website or services after updates constitutes acceptance of the revised terms.",
    },
];

const TermsConditions = () => (
    <div className="min-h-screen overflow-x-hidden bg-background">
        <Navbar />

        <main className="container-main pt-28 pb-16 space-y-12">
            <ScrollReveal className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Legal</p>
                <h1 className="text-3xl sm:text-4xl font-bold">Terms & Conditions</h1>
                <p className="text-muted-foreground">Last updated: March 22, 2026</p>
            </ScrollReveal>

            <ScrollReveal className="max-w-5xl border rounded-2xl p-6 sm:p-8 bg-card text-sm sm:text-base text-muted-foreground leading-relaxed">
                <p>
                    These Terms and Conditions govern your use of our website and services. Please read these clauses carefully
                    before engaging with PayXpress Solutions.
                </p>
            </ScrollReveal>

            <div className="grid gap-6 max-w-5xl">
                {clauses.map((clause, index) => (
                    <ScrollReveal key={clause.title} delay={index * 35} className="border rounded-xl p-6 bg-card space-y-2">
                        <h2 className="text-foreground font-semibold text-lg">{clause.title}</h2>
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{clause.detail}</p>
                    </ScrollReveal>
                ))}
            </div>

            <ScrollReveal className="max-w-5xl border rounded-2xl p-6 sm:p-8 bg-muted/40 space-y-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
                <h2 className="text-foreground font-semibold text-lg">Questions About Terms</h2>
                <p>
                    If you have questions about these terms, contact our team at
                    <a href="mailto:legal@payxpress-solutions.com" className="text-accent hover:underline"> legal@payxpress-solutions.com</a>.
                </p>
            </ScrollReveal>
        </main>

        <Footer />
    </div>
);

export default TermsConditions;
