import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-image.jpg";
import ScrollReveal from "./ScrollReveal";

const HeroSection = () => {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="home" className="section-padding pt-16">
      <div className="container-main grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <ScrollReveal className="space-y-6">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] text-balance">
            Web, Android & iOS{" "}
            <span className="text-accent">Custom Development</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg leading-relaxed text-pretty">
            We build modern web applications and mobile apps for Android and iOS,
            along with APIs and automation systems tailored to business goals.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              onClick={() => scrollTo("products")}
              className="bg-accent text-accent-foreground hover:bg-accent/90 active:scale-[0.97] transition-all px-6 h-11"
            >
              Explore Products
            </Button>
            <Button
              variant="outline"
              onClick={() => scrollTo("contact")}
              className="h-11 px-6 active:scale-[0.97] transition-all"
            >
              Request Project
            </Button>
          </div>
          <p className="text-sm text-muted-foreground pt-2">
            Trusted by developers and growing businesses
          </p>
        </ScrollReveal>

        <ScrollReveal delay={150}>
          <img
            src={heroImage}
            alt="Software development dashboard"
            className="rounded-2xl border w-full"
            loading="eager"
          />
        </ScrollReveal>
      </div>
    </section>
  );
};

export default HeroSection;
