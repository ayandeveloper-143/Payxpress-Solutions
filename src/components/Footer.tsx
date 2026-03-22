import { Link } from "react-router-dom";
import { Globe2, Mail } from "lucide-react";

const quickLinks = [
  { label: "Home", to: "/" },
  { label: "Products", to: "/products" },
  { label: "Services", to: "/services" },
  { label: "Custom Solutions", to: "/custom-solutions" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

const policyLinks = [
  { label: "Privacy Policy", to: "/privacy-policy" },
  { label: "Terms", to: "/terms-conditions" },
  { label: "Cookie Policy", to: "/cookie-policy" },
  { label: "Refund Policy", to: "/refund-policy" },
  { label: "Return Policy", to: "/return-policy" },
  { label: "Cancel Policy", to: "/cancel-policy" },
];

const Footer = () => (
  <footer className="border-t bg-gradient-to-b from-background to-secondary/35">
    <div className="container-main py-12 md:py-14">
      <div className="grid gap-10 md:grid-cols-12 md:gap-8">
        <div className="space-y-4 md:col-span-5">
          <Link to="/" className="inline-flex items-center gap-2">
            <img src="/logo.png" alt="PayXpress logo" className="h-12 w-auto" />
          </Link>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            Premium software solutions for modern businesses, built for speed, security, and scale.
          </p>
        </div>

        <div className="md:col-span-3">
          <h3 className="text-sm font-semibold text-foreground">Quick Links</h3>
          <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
            {quickLinks.map((linkItem) => (
              <Link key={linkItem.label} to={linkItem.to} className="w-fit transition-colors hover:text-foreground">
                {linkItem.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <h3 className="text-sm font-semibold text-foreground">Policies</h3>
          <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
            {policyLinks.map((linkItem) => (
              <Link key={linkItem.label} to={linkItem.to} className="w-fit transition-colors hover:text-foreground">
                {linkItem.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <h3 className="text-sm font-semibold text-foreground">Contact</h3>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <a href="mailto:support@payxpress-solutions.com" className="flex items-start gap-2 hover:text-foreground transition-colors">
              <Mail size={16} className="mt-0.5 shrink-0" />
              <span className="break-all">support@payxpress-solutions.com</span>
            </a>
            <p className="flex items-start gap-2">
              <Globe2 size={16} className="mt-0.5 shrink-0" />
              <span>Serving clients worldwide</span>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10 border-t pt-5 text-xs text-muted-foreground">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} PayXpress Solutions. All rights reserved.</p>
          <p>Designed to deliver reliable digital growth.</p>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
