import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ScrollReveal from "@/components/ScrollReveal";

const sections = [
    {
        title: "1. Information We Collect",
        detail:
            "We collect information that you provide directly to us, such as your name, email address, company name, phone number, and project details submitted through forms, proposals, or direct communication channels.",
    },
    {
        title: "2. Automatically Collected Data",
        detail:
            "When you use our website, we may collect technical data such as browser type, device details, IP address, pages visited, session duration, and referral source for analytics and security monitoring.",
    },
    {
        title: "3. How We Use Your Information",
        detail:
            "We use your data to respond to inquiries, prepare quotations, deliver contracted services, maintain communication, improve website experience, and protect our platform from misuse or unauthorized access.",
    },
    {
        title: "4. Legal Basis for Processing",
        detail:
            "Depending on your region, we process personal data based on consent, contractual necessity, legal obligations, and legitimate interest in operating and improving our services.",
    },
    {
        title: "5. Data Sharing and Third Parties",
        detail:
            "We do not sell personal data. We may share limited information with trusted service providers for hosting, analytics, payment processing, or operational support, subject to confidentiality and data protection obligations.",
    },
    {
        title: "6. Data Retention",
        detail:
            "We retain personal information only as long as required for service delivery, legal compliance, dispute resolution, and internal record-keeping. Retention periods vary by data type and applicable law.",
    },
    {
        title: "7. Data Security",
        detail:
            "We apply reasonable administrative, technical, and organizational safeguards to protect your information against unauthorized access, loss, alteration, or misuse.",
    },
    {
        title: "8. International Data Transfers",
        detail:
            "Your data may be processed in jurisdictions outside your country where our infrastructure or service providers are located. We implement contractual and operational safeguards where required.",
    },
    {
        title: "9. Your Privacy Rights",
        detail:
            "You may have rights to access, correct, update, delete, or restrict processing of your personal information, and to withdraw consent where processing is consent-based.",
    },
    {
        title: "10. Policy Updates",
        detail:
            "We may update this policy periodically. Material updates will be reflected on this page with a revised effective date so you can stay informed of how we handle your data.",
    },
];

const PrivacyPolicy = () => (
    <div className="min-h-screen overflow-x-hidden bg-background">
        <Navbar />

        <main className="container-main pt-28 pb-16 space-y-12">
            <ScrollReveal className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Legal</p>
                <h1 className="text-3xl sm:text-4xl font-bold">Privacy Policy</h1>
                <p className="text-muted-foreground">Last updated: March 22, 2026</p>
            </ScrollReveal>

            <ScrollReveal className="max-w-5xl border rounded-2xl p-6 sm:p-8 bg-card text-sm sm:text-base text-muted-foreground leading-relaxed">
                <p>
                    This Privacy Policy explains how PayXpress Solutions collects, uses, stores, and protects your personal
                    information when you visit our website, contact our team, or use our services.
                </p>
            </ScrollReveal>

            <div className="grid gap-6 max-w-5xl">
                {sections.map((section, index) => (
                    <ScrollReveal key={section.title} delay={index * 40} className="border rounded-xl p-6 bg-card space-y-2">
                        <h2 className="text-foreground font-semibold text-lg">{section.title}</h2>
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{section.detail}</p>
                    </ScrollReveal>
                ))}
            </div>

            <ScrollReveal className="max-w-5xl border rounded-2xl p-6 sm:p-8 bg-muted/40 space-y-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
                <h2 className="text-foreground font-semibold text-lg">Contact For Privacy Requests</h2>
                <p>
                    For access, correction, deletion, or other privacy-related requests, contact us at
                    <a href="mailto:privacy@payxpress-solutions.com" className="text-accent hover:underline"> privacy@payxpress-solutions.com</a>.
                </p>
            </ScrollReveal>
        </main>

        <Footer />
    </div>
);

export default PrivacyPolicy;
