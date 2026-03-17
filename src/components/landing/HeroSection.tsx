import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, MapPin, Terminal, Code2, Cpu } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

const HeroSection = () => {
  const { settings } = useSettings();

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden bg-secondary">
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40" />
      
      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/6 w-[500px] h-[500px] bg-on-blue/8 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/6 w-[400px] h-[400px] bg-on-purple/8 rounded-full blur-[100px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-on-green/5 rounded-full blur-[150px]" />

      {/* Floating code snippets */}
      <div className="absolute top-32 right-16 hidden lg:block animate-float" style={{ animationDelay: "-1s" }}>
        <div className="px-4 py-2 rounded-lg bg-secondary-foreground/5 border border-secondary-foreground/10 backdrop-blur-sm">
          <code className="font-mono text-xs text-on-green">&lt;code /&gt;</code>
        </div>
      </div>
      <div className="absolute bottom-40 left-16 hidden lg:block animate-float" style={{ animationDelay: "-3s" }}>
        <div className="px-4 py-2 rounded-lg bg-secondary-foreground/5 border border-secondary-foreground/10 backdrop-blur-sm">
          <code className="font-mono text-xs text-on-yellow">$ npm start</code>
        </div>
      </div>
      <div className="absolute top-48 left-32 hidden xl:block animate-float" style={{ animationDelay: "-2s" }}>
        <div className="p-3 rounded-xl bg-secondary-foreground/5 border border-secondary-foreground/10">
          <Terminal className="w-5 h-5 text-on-orange" />
        </div>
      </div>
      <div className="absolute bottom-52 right-32 hidden xl:block animate-float" style={{ animationDelay: "-4s" }}>
        <div className="p-3 rounded-xl bg-secondary-foreground/5 border border-secondary-foreground/10">
          <Cpu className="w-5 h-5 text-on-blue" />
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-up">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-secondary-foreground font-body">
              {settings.hero_badge_text}
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-secondary-foreground leading-tight mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            {settings.hero_title}{" "}
            <span className="text-gradient-rainbow">with Hands-On Tech Training</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-secondary-foreground/60 max-w-2xl mx-auto mb-6 font-body animate-fade-up" style={{ animationDelay: "0.2s" }}>
            {settings.hero_subtitle}
          </p>

          {/* Locations */}
          <div className="flex items-center justify-center gap-6 mb-10 animate-fade-up" style={{ animationDelay: "0.25s" }}>
            <div className="flex items-center gap-2 text-secondary-foreground/50">
              <MapPin className="w-4 h-4 text-on-red" />
              <span className="text-sm font-medium">Port Harcourt</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-secondary-foreground/30" />
            <div className="flex items-center gap-2 text-secondary-foreground/50">
              <MapPin className="w-4 h-4 text-on-green" />
              <span className="text-sm font-medium">Warri</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <Link to="/auth?mode=signup">
              <Button size="lg" className="group bg-gradient-primary hover:opacity-90 px-8 text-primary-foreground shadow-glow">
                <Code2 className="w-5 h-5 mr-2" />
                Start Learning
                <ArrowRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <a href="#programs">
              <Button variant="outline" size="lg" className="px-8 border-secondary-foreground/20 text-secondary-foreground hover:bg-secondary-foreground/5">
                Explore Programs
              </Button>
            </a>
          </div>

          {/* Free Course Banner */}
          <div className="mt-8 animate-fade-up" style={{ animationDelay: "0.35s" }}>
            <Link to="/free-course" className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-on-green/10 border border-on-green/20 hover:border-on-green/40 transition-colors group">
              <span className="px-2 py-0.5 rounded-md bg-on-green text-secondary-foreground text-xs font-bold font-mono">FREE</span>
              <span className="text-sm font-medium text-secondary-foreground/80">3-Week Short Course — Warri Center Only</span>
              <ArrowRight className="w-4 h-4 text-on-green group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 pt-16 border-t border-secondary-foreground/10 animate-fade-up" style={{ animationDelay: "0.4s" }}>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-display font-bold text-on-blue mb-2">1000+</div>
              <div className="text-sm text-secondary-foreground/50 font-body">Trained Graduates</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-display font-bold text-on-green mb-2">2</div>
              <div className="text-sm text-secondary-foreground/50 font-body">Training Centers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-display font-bold text-on-orange mb-2">92%</div>
              <div className="text-sm text-secondary-foreground/50 font-body">Employment Rate</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;