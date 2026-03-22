import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import ScrollReveal from "./ScrollReveal";

const faqs = [
  {
    q: "What types of software do you offer?",
    a: "We offer ready-made scripts, SaaS platforms, e-commerce solutions, automation tools, CRM systems, and more. Each product is production-ready and fully documented.",
  },
  {
    q: "Can I request a custom project?",
    a: "Absolutely. We specialize in custom development — from web and mobile apps to APIs and automation pipelines. Share your requirements and we'll provide a detailed proposal.",
  },
  {
    q: "What technologies do you work with?",
    a: "Our stack includes React, Node.js, Python, PostgreSQL, and modern cloud infrastructure. We choose the best tools for each project's specific needs.",
  },
  {
    q: "How long does a typical project take?",
    a: "Timelines depend on scope. A standard script or plugin takes 1–2 weeks, while a full SaaS application may take 4–8 weeks. We provide estimates upfront.",
  },
  {
    q: "Do you provide post-delivery support?",
    a: "Yes. Every project includes 30 days of bug-fix support. We also offer extended maintenance plans for ongoing updates and feature development.",
  },
  {
    q: "What are your payment terms?",
    a: "We typically work with a 50% upfront deposit and 50% on delivery. For larger projects, milestone-based billing is available.",
  },
];

const FAQSection = () => (
  <section className="section-padding">
    <div className="container-main max-w-3xl space-y-10">
      <ScrollReveal className="text-center space-y-3">
        <h2 className="text-3xl sm:text-4xl font-bold">Frequently Asked Questions</h2>
        <p className="text-muted-foreground">
          Quick answers to common questions about our work.
        </p>
      </ScrollReveal>

      <ScrollReveal delay={100}>
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border rounded-xl px-5 data-[state=open]:border-accent/50 transition-colors"
            >
              <AccordionTrigger className="text-left font-medium text-sm hover:no-underline py-4">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollReveal>
    </div>
  </section>
);

export default FAQSection;
