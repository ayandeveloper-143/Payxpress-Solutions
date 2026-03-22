import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ScrollReveal from "@/components/ScrollReveal";

const services = [
    {
        title: "Custom Web Applications",
        detail: "Scalable dashboards, portals, and SaaS products for operations, analytics, and customer workflows.",
    },
    {
        title: "Android & iOS App Development",
        detail: "Mobile products for both Android and iOS with smooth UX, secure APIs, and production-ready performance.",
    },
    {
        title: "E-commerce & Platform Development",
        detail: "High-converting stores and service platforms with payment integration, admin management, and order flows.",
    },
    {
        title: "API, Automation & Integrations",
        detail: "Custom APIs and automation pipelines to connect your tools and remove repetitive manual work.",
    },
    {
        title: "Maintenance & Support",
        detail: "Performance optimization, security hardening, bug fixes, and ongoing upgrades after launch.",
    },
];

const techStack = [
    "TypeScript",
    "React",
    "Next.js",
    "Node.js",
    "Python",
    "Go",
    "Flutter",
    "React Native",
    "Kotlin",
    "Swift",
    "PostgreSQL",
    "Docker",
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
                    We deliver complete software solutions across web and mobile. From product strategy to deployment, we help
                    teams launch reliable platforms for browser, Android, and iOS users.
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

            <ScrollReveal className="border rounded-2xl p-6 sm:p-8 bg-card space-y-4">
                <h2 className="text-2xl font-semibold">Trending Tech Stack We Use</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    We choose tools based on project goals, but these are the most in-demand and battle-tested technologies we
                    use for modern products.
                </p>
                <div className="flex flex-wrap gap-2">
                    {techStack.map((tech) => (
                        <span key={tech} className="rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium">
                            {tech}
                        </span>
                    ))}
                </div>
            </ScrollReveal>

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
