import ScrollReveal from "./ScrollReveal";

const stats = [
  { value: "120+", label: "Projects Delivered" },
  { value: "85", label: "Clients Worldwide" },
  { value: "99.7%", label: "Uptime Guarantee" },
  { value: "4.9", label: "Avg. Client Rating" },
];

const StatsBar = () => (
  <section className="py-12 border-y bg-accent">
    <div className="container-main">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((s, i) => (
          <ScrollReveal key={s.label} delay={i * 80} className="text-center space-y-1">
            <p className="text-3xl sm:text-4xl font-extrabold text-primary-foreground">{s.value}</p>
            <p className="text-sm text-primary-foreground/70">{s.label}</p>
          </ScrollReveal>
        ))}
      </div>
    </div>
  </section>
);

export default StatsBar;
