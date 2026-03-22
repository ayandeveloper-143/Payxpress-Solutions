import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const links = [
  { label: "Home", to: "/" },
  { label: "Products", to: "/products" },
  { label: "Services", to: "/services" },
  { label: "Custom", to: "/custom-solutions" },
  { label: "About Us", to: "/about" },
  { label: "Contact", to: "/contact" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 z-50 bg-background/95 backdrop-blur-sm border-b w-full">
      <div className="container-main flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <img src="/logo.png" alt="PayXpress logo" className="h-12 w-auto" />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:block">
          <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 active:scale-[0.97] transition-all">
            <Link to="/contact">Get Started</Link>
          </Button>
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t bg-background px-4 pb-4 pt-2 space-y-2">
          {links.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block w-full text-left py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
          <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            <Link to="/contact" onClick={() => setOpen(false)}>
              Get Started
            </Link>
          </Button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
