import { Button } from "@/components/ui/button";
import customDevImage from "@/assets/custom-dev-image.jpg";
import ScrollReveal from "./ScrollReveal";

const CustomDevSection = () => (
  <section id="custom" className="section-padding">
    <div className="container-main grid lg:grid-cols-2 gap-12 items-center">
      <ScrollReveal className="space-y-6">
        <h2 className="text-3xl sm:text-4xl font-bold">Need a Custom Solution?</h2>
        <p className="text-muted-foreground leading-relaxed text-pretty">
          We build tailored applications, websites, and automation tools designed
          specifically for your business requirements. From concept to deployment,
          our team handles everything so you can focus on growth.
        </p>
        <Button
          className="bg-accent text-accent-foreground hover:bg-accent/90 active:scale-[0.97] transition-all px-6 h-11"
          onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
        >
          Get Proposal
        </Button>
      </ScrollReveal>
      <ScrollReveal delay={120}>
        <img
          src={customDevImage}
          alt="Custom development"
          className="rounded-2xl border w-full"
          loading="lazy"
        />
      </ScrollReveal>
    </div>
  </section>
);

export default CustomDevSection;
