import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import ScrollReveal from "./ScrollReveal";

const ContactSection = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    toast.success("Message sent! We'll get back to you soon.");
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <section id="contact" className="section-padding bg-section-alt">
      <div className="container-main max-w-2xl space-y-8">
        <ScrollReveal className="text-center space-y-3">
          <h2 className="text-3xl sm:text-4xl font-bold">Get in Touch</h2>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Mail size={16} />
            <span className="text-sm">support@payxpress-solutions.com</span>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Your name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              maxLength={100}
            />
            <Input
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              maxLength={255}
            />
            <Textarea
              placeholder="Your message"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={5}
              maxLength={1000}
            />
            <Button
              type="submit"
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 active:scale-[0.97] transition-all h-11"
            >
              Send Message
            </Button>
          </form>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default ContactSection;
