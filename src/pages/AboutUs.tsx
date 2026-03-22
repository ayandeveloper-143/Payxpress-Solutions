import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ScrollReveal from "@/components/ScrollReveal";

const values = [
    {
        title: "Client-First Approach",
        detail: "Every feature decision is based on business value, speed, and long-term maintainability.",
    },
    {
        title: "Reliable Delivery",
        detail: "We ship production-ready software with clean architecture and predictable timelines.",
    },
    {
        title: "Transparent Process",
        detail: "Clear milestones, regular demos, and direct communication through every project phase.",
    },
];

const milestones = [
    { year: "2020", detail: "Started with a small team focused on web product delivery for startups." },
    { year: "2022", detail: "Expanded into automation and client portal solutions for growing businesses." },
    { year: "2024", detail: "Launched multiple reusable product accelerators and SaaS modules." },
    { year: "2026", detail: "Supporting clients globally with custom builds and long-term technical partnerships." },
];

const teamStrengths = [
    "Product-focused engineers",
    "Modern frontend architecture",
    "Secure backend development",
    "Performance and SEO optimization",
    "Post-launch support and scaling",
    "Clear communication and transparent planning",
];

const AboutUs = () => (
    <div className="min-h-screen overflow-x-hidden bg-background">
        <Navbar />

        <main className="container-main pt-28 pb-16 space-y-16">
            <ScrollReveal className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">About Us</p>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight max-w-3xl">
                    We build software products that help modern businesses grow faster.
                </h1>
                <p className="text-muted-foreground leading-relaxed max-w-3xl">
                    PayXpress Solutions is a product-driven software studio focused on practical digital experiences. Our team
                    works with startups, agencies, and established companies to design, build, and scale software that solves
                    real business problems.
                </p>
            </ScrollReveal>

            <section className="grid md:grid-cols-3 gap-6">
                {values.map((value, index) => (
                    <ScrollReveal key={value.title} delay={index * 90} className="border rounded-xl p-6 bg-card space-y-2">
                        <h2 className="font-semibold text-lg">{value.title}</h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">{value.detail}</p>
                    </ScrollReveal>
                ))}
            </section>

            <ScrollReveal className="border rounded-2xl p-6 sm:p-8 bg-muted/40 space-y-4">
                <h2 className="text-2xl font-semibold">How We Work</h2>
                <p className="text-muted-foreground leading-relaxed">
                    Our process starts with discovery and requirement mapping, then moves to visual prototyping, development,
                    quality assurance, and launch support. We stay focused on outcomes: better conversions, faster operations,
                    and stronger customer experience.
                </p>
            </ScrollReveal>

            <section className="grid lg:grid-cols-2 gap-8 items-start">
                <ScrollReveal className="border rounded-2xl p-6 sm:p-8 bg-card space-y-4">
                    <h2 className="text-2xl font-semibold">Our Journey</h2>
                    <div className="space-y-4">
                        {milestones.map((milestone) => (
                            <div key={milestone.year} className="border-l-2 border-accent/30 pl-4">
                                <p className="font-semibold text-accent">{milestone.year}</p>
                                <p className="text-sm text-muted-foreground leading-relaxed">{milestone.detail}</p>
                            </div>
                        ))}
                    </div>
                </ScrollReveal>

                <ScrollReveal className="border rounded-2xl p-6 sm:p-8 bg-muted/30 space-y-4" delay={80}>
                    <h2 className="text-2xl font-semibold">Team Strengths</h2>
                    <ul className="grid sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                        {teamStrengths.map((strength) => (
                            <li key={strength} className="flex items-start gap-2">
                                <span className="mt-2 size-1.5 rounded-full bg-accent" />
                                <span>{strength}</span>
                            </li>
                        ))}
                    </ul>
                </ScrollReveal>
            </section>
        </main>

        <Footer />
    </div>
);

export default AboutUs;
