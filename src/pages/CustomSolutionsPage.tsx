import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ScrollReveal from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const solutionAreas = [
    {
        title: "Business Process Automation",
        detail: "Replace repetitive tasks with rule-based workflows and smart triggers.",
    },
    {
        title: "Operations Dashboards",
        detail: "Get real-time visibility into KPIs, team activity, and business bottlenecks.",
    },
    {
        title: "Client Portals",
        detail: "Provide secure, branded spaces for your customers to collaborate and track progress.",
    },
    {
        title: "Internal Tools",
        detail: "Build high-impact tools tailored exactly to your organization’s unique workflow.",
    },
];

const phases = [
    "Discovery and process mapping",
    "System architecture and UX planning",
    "Agile development with milestones",
    "Quality testing and launch",
    "Post-launch optimization and support",
];

const CustomSolutionsPage = () => (
    <div className="min-h-screen overflow-x-hidden bg-background">
        <Navbar />

        <main className="container-main pt-28 pb-16 space-y-16">
            <section className="space-y-4 max-w-4xl">
                <ScrollReveal>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Custom Solutions</p>
                </ScrollReveal>
                <ScrollReveal delay={60}>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                        Custom software built around your exact business workflow.
                    </h1>
                </ScrollReveal>
                <ScrollReveal delay={120}>
                    <p className="text-muted-foreground leading-relaxed">
                        When off-the-shelf tools cannot fit your process, we build custom products that match your operations,
                        team structure, and growth goals. From internal tools to full client platforms, we design and deliver
                        software that works the way your business works.
                    </p>
                </ScrollReveal>
            </section>

            <section className="grid sm:grid-cols-2 gap-6">
                {solutionAreas.map((item, index) => (
                    <ScrollReveal key={item.title} delay={index * 80} className="border rounded-xl p-6 bg-card space-y-2">
                        <h2 className="font-semibold text-lg">{item.title}</h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.detail}</p>
                    </ScrollReveal>
                ))}
            </section>

            <section className="grid lg:grid-cols-2 gap-8 items-start">
                <ScrollReveal className="border rounded-2xl p-6 sm:p-8 bg-muted/40 space-y-4">
                    <h2 className="text-2xl font-semibold">Delivery Roadmap</h2>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        {phases.map((phase) => (
                            <li key={phase} className="flex items-start gap-2">
                                <span className="mt-2 size-1.5 rounded-full bg-accent" />
                                <span>{phase}</span>
                            </li>
                        ))}
                    </ul>
                </ScrollReveal>

                <ScrollReveal className="border rounded-2xl p-6 sm:p-8 bg-card space-y-4" delay={100}>
                    <h2 className="text-2xl font-semibold">Ready to Build?</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Share your business use-case and we will suggest the most practical architecture, timeline, and delivery
                        plan for your custom project.
                    </p>
                    <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                        <Link to="/contact">Start Your Custom Project</Link>
                    </Button>
                </ScrollReveal>
            </section>
        </main>

        <Footer />
    </div>
);

export default CustomSolutionsPage;
