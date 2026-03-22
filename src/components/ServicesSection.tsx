import { Globe, Smartphone, Code2 } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const services = [
  {
    icon: Globe,
    title: "Web Development",
    desc: "Business websites, dashboards, and SaaS platforms built with React, Next.js, TypeScript, and modern backend architecture.",
  },
  {
    icon: Smartphone,
    title: "Android & iOS Apps",
    desc: "Mobile applications for both Android and iOS using Flutter, React Native, Kotlin, and Swift based on your product needs.",
  },
  {
    icon: Code2,
    title: "API & Automation",
    desc: "Secure APIs, admin panels, and workflow automation with Node.js, Python, PostgreSQL, and cloud-native tooling.",
  },
];

const ServicesSection = () => (
  <section id="services" className="section-padding bg-section-alt">
    <div className="container-main space-y-12">
      <ScrollReveal className="text-center space-y-3">
        <h2 className="text-3xl sm:text-4xl font-bold">Our Services</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">End-to-end development services for every stage of your business.</p>
      </ScrollReveal>
      <div className="grid md:grid-cols-3 gap-8">
        {services.map((s, i) => (
          <ScrollReveal key={s.title} delay={i * 100}>
            <div className="text-center space-y-4 p-8 rounded-xl border bg-card hover:border-accent/50 transition-colors">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-accent/10 text-accent">
                <s.icon size={24} />
              </div>
              <h3 className="font-semibold text-lg">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  </section>
);

export default ServicesSection;
