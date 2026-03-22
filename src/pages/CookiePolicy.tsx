import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ScrollReveal from "@/components/ScrollReveal";

const cookieTypes = [
    {
        title: "1. Essential Cookies",
        detail:
            "These cookies are required for core website functionality, security, and session management. Without them, key parts of the website may not function correctly.",
    },
    {
        title: "2. Performance and Analytics Cookies",
        detail:
            "These cookies help us understand how visitors interact with the website, which pages are used most, and where improvements are needed.",
    },
    {
        title: "3. Functional Cookies",
        detail:
            "Functional cookies remember preferences such as language settings or form values to provide a more personalized browsing experience.",
    },
    {
        title: "4. Third-Party Cookies",
        detail:
            "Some pages may use trusted third-party tools for analytics or embedded services. These providers may place cookies according to their own policies.",
    },
    {
        title: "5. Cookie Duration",
        detail:
            "Cookies may be session-based (deleted when the browser closes) or persistent (stored for a defined period) depending on their purpose.",
    },
    {
        title: "6. Managing Cookie Preferences",
        detail:
            "Most browsers let you block, delete, or limit cookies through settings. Disabling some cookies may reduce site functionality and user experience.",
    },
    {
        title: "7. Do Not Track",
        detail:
            "Some browsers offer a Do Not Track feature. Because no universal standard exists, our website may not respond uniformly to all DNT signals.",
    },
    {
        title: "8. Policy Updates",
        detail:
            "We may update this Cookie Policy to reflect legal requirements, technology updates, or service improvements. Updates are published on this page.",
    },
];

const CookiePolicy = () => (
    <div className="min-h-screen overflow-x-hidden bg-background">
        <Navbar />

        <main className="container-main pt-28 pb-16 space-y-12">
            <ScrollReveal className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Legal</p>
                <h1 className="text-3xl sm:text-4xl font-bold">Cookie Policy</h1>
                <p className="text-muted-foreground">Last updated: March 22, 2026</p>
            </ScrollReveal>

            <ScrollReveal className="max-w-5xl border rounded-2xl p-6 sm:p-8 bg-card text-sm sm:text-base text-muted-foreground leading-relaxed">
                <p>
                    This Cookie Policy explains what cookies are, how we use them on our website, and how you can control your
                    cookie preferences.
                </p>
            </ScrollReveal>

            <div className="grid gap-6 max-w-5xl">
                {cookieTypes.map((cookie, index) => (
                    <ScrollReveal key={cookie.title} delay={index * 40} className="border rounded-xl p-6 bg-card space-y-2">
                        <h2 className="text-foreground font-semibold text-lg">{cookie.title}</h2>
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{cookie.detail}</p>
                    </ScrollReveal>
                ))}
            </div>

            <ScrollReveal className="max-w-5xl border rounded-2xl p-6 sm:p-8 bg-muted/40 space-y-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
                <h2 className="text-foreground font-semibold text-lg">Cookie Related Questions</h2>
                <p>
                    If you need help understanding this policy, contact us at
                    <a href="mailto:privacy@payxpress-solutions.com" className="text-accent hover:underline"> privacy@payxpress-solutions.com</a>.
                </p>
            </ScrollReveal>
        </main>

        <Footer />
    </div>
);

export default CookiePolicy;
