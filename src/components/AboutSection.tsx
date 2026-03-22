import ScrollReveal from "./ScrollReveal";

const AboutSection = () => (
  <section id="about" className="section-padding bg-section-alt">
    <div className="container-main max-w-3xl text-center space-y-6">
      <ScrollReveal>
        <h2 className="text-3xl sm:text-4xl font-bold">About PayXpress Solutions</h2>
      </ScrollReveal>
      <ScrollReveal delay={80}>
        <p className="text-muted-foreground leading-relaxed text-pretty">
          PayXpress Solutions is a software development company building modern web
          platforms and mobile apps for Android and iOS. We also provide end-to-end
          custom engineering, API integrations, and automation solutions tailored to
          your business goals. Our work prioritizes scalability, performance, and
          reliability so you can launch confidently and grow without limits.
        </p>
      </ScrollReveal>
    </div>
  </section>
);

export default AboutSection;
