import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ScrollReveal from "@/components/ScrollReveal";

const services = [
    {
        title: "Custom Web Applications",
        detail: "Scalable dashboards, portals, and internal systems tailored to your workflow.",
    },
    {
        title: "E-commerce Development",
        detail: "Complete online stores with smooth checkout flows, payment integration, and order operations.",
    },
    {
        title: "Automation & Integrations",
        detail: "Automate repetitive operations and connect your business tools to save time.",
    },
    {
        title: "Maintenance & Support",
        detail: "Performance optimization, security hardening, bug fixes, and ongoing platform upgrades.",
    },
];

const workflow = [
    "Discovery workshop and requirement mapping",
    "UI/UX and technical architecture planning",
    "Agile sprint-based implementation",
    "Quality assurance and performance testing",
    "Go-live support and optimization",
];

const engagements = [
    {
        title: "Fixed Scope Delivery",
        detail: "Best for clearly defined projects with agreed timelines and deliverables.",
    },
    {
        title: "Dedicated Team",
        detail: "Ideal for continuous product development and fast iteration cycles.",
    },
    {
        title: "Support Retainer",
        detail: "For businesses needing regular updates, maintenance, and technical support.",
    },
];

const ServicesPage = () => (
    <div className="min-h-screen overflow-x-hidden bg-background">
        <Navbar />

        <main className="container-main pt-28 pb-16 space-y-14">
            <ScrollReveal className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Services</p>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight max-w-3xl">
                    End-to-end software services from idea to launch and beyond.
                </h1>
                <p className="text-muted-foreground leading-relaxed max-w-3xl">
                    We combine product strategy, UI engineering, and robust backend delivery to help teams launch faster with
                    confidence.
                </p>
            </ScrollReveal>

            <section className="grid sm:grid-cols-2 gap-6">
                {services.map((service, index) => (
                    <ScrollReveal key={service.title} delay={index * 80} className="border rounded-xl p-6 bg-card space-y-2">
                        <h2 className="font-semibold text-lg">{service.title}</h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">{service.detail}</p>
                    </ScrollReveal>
                ))}
            </section>

            <section className="grid lg:grid-cols-2 gap-8">
                <ScrollReveal className="border rounded-2xl p-6 sm:p-8 bg-muted/40 space-y-4">
                    <h2 className="text-2xl font-semibold">Delivery Workflow</h2>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        {workflow.map((step) => (
                            <li key={step} className="flex items-start gap-2">
                                <span className="mt-2 size-1.5 rounded-full bg-accent" />
                                <span>{step}</span>
                            </li>
                        ))}
                    </ul>
                </ScrollReveal>

                <ScrollReveal className="border rounded-2xl p-6 sm:p-8 bg-card space-y-4" delay={90}>
                    <h2 className="text-2xl font-semibold">Engagement Models</h2>
                    <div className="space-y-4">
                        {engagements.map((model) => (
                            <div key={model.title} className="border rounded-lg p-4 bg-background">
                                <h3 className="font-semibold">{model.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{model.detail}</p>
                            </div>
                        ))}
                    </div>
                </ScrollReveal>
            </section>
        </main>

        <Footer />
    </div>
);

export default ServicesPage;
