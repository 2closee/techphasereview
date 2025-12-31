import { Link } from "react-router-dom";
import { ChefHat, Scissors, Facebook, Instagram, Twitter, Linkedin } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    programs: [
      { name: "Culinary Arts", href: "#programs" },
      { name: "Fashion Design", href: "#programs" },
      { name: "Certificate Courses", href: "#programs" },
      { name: "Workshops", href: "#programs" },
    ],
    company: [
      { name: "About Us", href: "#about" },
      { name: "Our Faculty", href: "#about" },
      { name: "Careers", href: "#contact" },
      { name: "News & Events", href: "#" },
    ],
    support: [
      { name: "Contact Us", href: "#contact" },
      { name: "FAQs", href: "#" },
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
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-gold shadow-gold">
                <ChefHat className="w-6 h-6 text-primary-foreground" />
                <Scissors className="w-4 h-4 text-primary-foreground absolute -bottom-1 -right-1" />
              </div>
              <div className="flex flex-col">
                <span className="font-display text-xl font-bold text-secondary-foreground">Topearl</span>
                <span className="text-xs text-secondary-foreground/60 font-body tracking-wider">INTERNATIONAL INSTITUTE</span>
              </div>
            </Link>
            <p className="text-secondary-foreground/70 font-body mb-6 max-w-sm">
              Empowering the next generation of culinary artists and fashion designers 
              with world-class training and industry connections.
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="w-10 h-10 rounded-lg bg-secondary-foreground/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Programs */}
          <div>
            <h3 className="font-display font-semibold text-lg mb-4">Programs</h3>
            <ul className="space-y-3">
              {footerLinks.programs.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-secondary-foreground/70 hover:text-primary font-body transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-display font-semibold text-lg mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-secondary-foreground/70 hover:text-primary font-body transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-display font-semibold text-lg mb-4">Support</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-secondary-foreground/70 hover:text-primary font-body transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-secondary-foreground/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-secondary-foreground/60 text-sm font-body">
            © {currentYear} Topearl International Institute. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm font-body">
            <a href="#" className="text-secondary-foreground/60 hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-secondary-foreground/60 hover:text-primary transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
