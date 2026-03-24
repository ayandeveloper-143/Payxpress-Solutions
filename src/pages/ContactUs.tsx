import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ContactSection from "@/components/ContactSection";
import ScrollReveal from "@/components/ScrollReveal";

const ContactUs = () => (
    <div className="min-h-screen overflow-x-hidden bg-background">
        <Navbar />

        <main className="container-main pt-28 pb-16 space-y-10">
            <ScrollReveal className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Contact Us</p>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight max-w-3xl">
                    Tell us your idea and we will turn it into a production-ready product.
                </h1>
            </ScrollReveal>

            <ScrollReveal className="border rounded-2xl p-6 sm:p-8 bg-card space-y-5 max-w-3xl">
                <div>
                    <p className="text-sm uppercase tracking-wider text-muted-foreground">Email</p>
                    <a href="mailto:hello@payxpress-solutions.com" className="text-lg font-semibold text-accent hover:underline">
                        hello@payxpress-solutions.com
                    </a>
                </div>

                <div>
                    <p className="text-sm uppercase tracking-wider text-muted-foreground">Sales</p>
                    <a href="mailto:sales@payxpress-solutions.com" className="text-lg font-semibold text-accent hover:underline">
                        sales@payxpress-solutions.com
                    </a>
                </div>

                <div>
                    <p className="text-sm uppercase tracking-wider text-muted-foreground">Working Hours</p>
                    <p className="text-muted-foreground">Monday to Saturday, 10:00 AM to 7:00 PM</p>
                </div>
            </ScrollReveal>

            <section className="grid lg:grid-cols-2 gap-6">
                <ScrollReveal className="border rounded-2xl p-6 sm:p-8 bg-muted/40 space-y-3">
                    <h2 className="text-2xl font-semibold">Office Information</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        PayXpress Solutions works with clients globally through remote-first collaboration. For enterprise projects,
                        we also support scheduled meetings and dedicated communication channels.
                    </p>
                    <p className="text-sm text-muted-foreground">Response time: usually within 24 business hours.</p>
                </ScrollReveal>

                <ScrollReveal className="border rounded-2xl p-6 sm:p-8 bg-card space-y-3" delay={80}>
                    <h2 className="text-2xl font-semibold">Before You Contact</h2>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <span className="mt-2 size-1.5 rounded-full bg-accent" />
                            <span>Project goal and target users</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="mt-2 size-1.5 rounded-full bg-accent" />
                            <span>Expected timeline and launch window</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="mt-2 size-1.5 rounded-full bg-accent" />
                            <span>Feature list or reference products</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="mt-2 size-1.5 rounded-full bg-accent" />
                            <span>Preferred engagement model and budget range</span>
                        </li>
                    </ul>
                </ScrollReveal>
            </section>
        </main>

        <ContactSection />

        <Footer />
    </div>
);

export default ContactUs;
