import { Link } from "react-router-dom";

const footerLinks = [
  { label: "Home", to: "/" },
  { label: "Products", to: "/products" },
  { label: "Services", to: "/services" },
  { label: "Custom Solutions", to: "/custom-solutions" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
  { label: "Privacy Policy", to: "/privacy-policy" },
  { label: "Terms", to: "/terms-conditions" },
  { label: "Cookie Policy", to: "/cookie-policy" },
];

const Footer = () => (
  <footer className="border-t py-12">
    <div className="container-main flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="space-y-1 text-center md:text-left">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="PayXpress logo" className="h-12 w-auto" />
        </Link>
        <p className="text-sm text-muted-foreground">Premium software solutions for modern businesses.</p>
      </div>
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
        {footerLinks.map((linkItem) => (
          <Link key={linkItem.label} to={linkItem.to} className="hover:text-foreground transition-colors">
            {linkItem.label}
          </Link>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} PayXpress Solutions. All rights reserved.</p>
    </div>
  </footer>
);

export default Footer;
