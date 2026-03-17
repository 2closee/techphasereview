import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Linkedin } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import logoImg from "@/assets/logo.png";

const Footer = () => {
  const { settings } = useSettings();
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    programs: [
      { name: "Hardware & Networking", href: "#programs" },
      { name: "Electrical/Electronics", href: "#programs" },
      { name: "Database Administration", href: "#programs" },
      { name: "Network Administration", href: "#programs" },
    ],
    company: [
      { name: "About Us", href: "#about" },
      { name: "Our Instructors", href: "#about" },
      { name: "Careers", href: "#contact" },
      { name: "News & Events", href: "#" },
    ],
    support: [
      { name: "Contact Us", href: "#contact" },
      { name: "FAQs", href: "#faq" },
      { name: "Student Portal", href: "/auth" },
      { name: "Payment Options", href: "#admissions" },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: "#" },
    { icon: Instagram, href: "#" },
    { icon: Twitter, href: "#" },
    { icon: Linkedin, href: "#" },
  ];

  return (
    <footer className="bg-secondary text-secondary-foreground border-t border-secondary-foreground/10">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <img src={logoImg} alt="Onlinnodes Logo" className="h-10 w-auto" />
            </Link>
            <p className="text-secondary-foreground/50 font-body mb-6 max-w-sm text-sm">
              {settings.footer_description}
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="w-10 h-10 rounded-lg bg-secondary-foreground/5 border border-secondary-foreground/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Programs */}
          <div>
            <h3 className="font-display font-semibold text-sm mb-4 text-secondary-foreground/80 uppercase tracking-wider">Programs</h3>
            <ul className="space-y-3">
              {footerLinks.programs.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-secondary-foreground/50 hover:text-primary font-body transition-colors text-sm">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-display font-semibold text-sm mb-4 text-secondary-foreground/80 uppercase tracking-wider">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-secondary-foreground/50 hover:text-primary font-body transition-colors text-sm">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-display font-semibold text-sm mb-4 text-secondary-foreground/80 uppercase tracking-wider">Support</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-secondary-foreground/50 hover:text-primary font-body transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-secondary-foreground/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-secondary-foreground/40 text-sm font-body">
            © {currentYear} Onlinnodes. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm font-body">
            <Link to="/privacy-policy" className="text-secondary-foreground/40 hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-secondary-foreground/40 hover:text-primary transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;