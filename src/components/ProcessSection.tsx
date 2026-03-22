import ScrollReveal from "./ScrollReveal";

const steps = [
  { num: "01", title: "Requirement Discussion", desc: "We understand your goals, timeline, and technical needs." },
  { num: "02", title: "Planning & Proposal", desc: "Detailed roadmap with milestones, deliverables, and pricing." },
  { num: "03", title: "Development", desc: "Iterative development with regular updates and feedback cycles." },
  { num: "04", title: "Delivery", desc: "Tested, documented, and deployed — ready for your users." },
];

const ProcessSection = () => (
  <section className="section-padding">
    <div className="container-main space-y-12">
      <ScrollReveal className="text-center space-y-3">
        <h2 className="text-3xl sm:text-4xl font-bold">Our Process</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">A transparent, structured approach from idea to launch.</p>
      </ScrollReveal>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 ">
        {steps.map((s, i) => (
          <ScrollReveal key={s.num} delay={i * 100}>
            <div className="relative p-6 rounded-xl border bg-card space-y-3 hover:border-accent/50 transition-colors">
              <span className="text-3xl font-extrabold text-accent/20">{s.num}</span>
              <h3 className="font-semibold">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  </section>
);

export default ProcessSection;
