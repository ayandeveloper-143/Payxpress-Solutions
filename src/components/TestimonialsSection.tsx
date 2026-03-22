import { Star } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const testimonials = [
  {
    name: "Arjun Mehta",
    role: "CTO, FinLeap Technologies",
    quote: "PayXpress delivered a payment automation system that cut our processing time by 68%. Their code quality and communication were exceptional throughout.",
    rating: 5,
  },
  {
    name: "Sarah Lindström",
    role: "Founder, NordCommerce",
    quote: "We needed a custom e-commerce backend on a tight deadline. They shipped it two days early — fully tested, documented, and production-ready.",
    rating: 5,
  },
  {
    name: "David Okonkwo",
    role: "Product Lead, Caravel Health",
    quote: "Their SaaS starter kit saved us three months of development. We launched our MVP and onboarded 1,200 users in the first week.",
    rating: 5,
  },
];

const TestimonialsSection = () => (
  <section className="section-padding">
    <div className="container-main space-y-12">
      <ScrollReveal className="text-center space-y-3">
        <h2 className="text-3xl sm:text-4xl font-bold">What Our Clients Say</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Real feedback from teams we've worked with.
        </p>
      </ScrollReveal>

      <div className="grid md:grid-cols-3 gap-6">
        {testimonials.map((t, i) => (
          <ScrollReveal key={t.name} delay={i * 100}>
            <div className="p-6 rounded-xl border bg-card space-y-4 hover:border-accent/50 transition-colors h-full">
              <div className="flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} size={14} className="fill-accent text-accent" />
                ))}
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground italic">
                "{t.quote}"
              </p>
              <div className="pt-2 border-t">
                <p className="font-semibold text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
