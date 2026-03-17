import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import logoImg from "@/assets/logo.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, role } = useAuth();

  const getDashboardPath = () => {
    switch (role) {
      case 'super_admin':
      case 'admin': return '/admin';
      case 'accountant': return '/accountant';
      case 'teacher': return '/teacher';
      case 'student': return '/student';
      default: return '/auth';
    }
  };

  const navLinks = [
    { name: "Programs", href: "#programs" },
    { name: "About", href: "#about" },
    { name: "Admissions", href: "#admissions" },
    { name: "FAQ", href: "#faq" },
    { name: "Contact", href: "#contact" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-secondary/90 backdrop-blur-lg border-b border-secondary-foreground/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={logoImg} alt="Onlinnodes Logo" className="h-10 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-secondary-foreground/60 hover:text-primary font-medium transition-colors duration-200 font-body text-sm"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link to={getDashboardPath()}>
                <Button size="sm" className="bg-gradient-primary hover:opacity-90 text-primary-foreground">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm" className="text-secondary-foreground/70 hover:text-secondary-foreground">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-glow">
                    Enroll Now
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-secondary-foreground"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-secondary-foreground/10 animate-fade-up">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="text-secondary-foreground/60 hover:text-primary font-medium py-2 font-body"
                >
                  {link.name}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-secondary-foreground/10">
                {user ? (
                  <Link to={getDashboardPath()} onClick={() => setIsOpen(false)}>
                    <Button className="w-full bg-gradient-primary text-primary-foreground">
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/auth" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full border-secondary-foreground/20 text-secondary-foreground">
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/register" onClick={() => setIsOpen(false)}>
                      <Button className="w-full bg-gradient-primary text-primary-foreground">
                        Enroll Now
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;