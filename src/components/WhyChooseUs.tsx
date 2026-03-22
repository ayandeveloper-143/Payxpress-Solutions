import { Users, ShieldCheck, Zap, TrendingUp } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const features = [
  { icon: Users, title: "Experienced Team", desc: "Senior engineers with years of real-world product development." },
  { icon: ShieldCheck, title: "Secure Code", desc: "Security-first approach with best practices baked into every line." },
  { icon: Zap, title: "Fast Delivery", desc: "Agile workflows that get your product to market on time." },
  { icon: TrendingUp, title: "Scalable Systems", desc: "Architecture designed to grow with your user base." },
];

const WhyChooseUs = () => (
  <section className="section-padding bg-section-alt">
    <div className="container-main space-y-12">
      <ScrollReveal className="text-center space-y-3">
        <h2 className="text-3xl sm:text-4xl font-bold">Why Choose Us</h2>
      </ScrollReveal>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f, i) => (
          <ScrollReveal key={f.title} delay={i * 80}>
            <div className="p-6 rounded-xl border bg-card space-y-3 hover:border-accent/50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                <f.icon size={20} />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  </section>
);

export default WhyChooseUs;
