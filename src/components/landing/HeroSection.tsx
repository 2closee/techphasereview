import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, MapPin } from "lucide-react";
const HeroSection = () => {
  return <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-float" style={{
      animationDelay: "-3s"
    }} />
      
      {/* Decorative Elements */}
      <div className="absolute top-32 right-20 hidden lg:block">
        <div className="w-20 h-20 border-2 border-primary/20 rounded-full animate-float" style={{
        animationDelay: "-1s"
      }} />
      </div>
      <div className="absolute bottom-40 left-20 hidden lg:block">
        <div className="w-12 h-12 bg-primary/10 rounded-lg rotate-45 animate-float" style={{
        animationDelay: "-2s"
      }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent border border-primary/20 mb-8 animate-fade-up">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground font-body">
              Enrolling Now for 2026 Cohort
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-foreground leading-tight mb-6 animate-fade-up" style={{
          animationDelay: "0.1s"
        }}>
            Build Your Tech Career with{" "}
            <span className="text-gradient-primary">TVET Training</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 font-body animate-fade-up" style={{
          animationDelay: "0.2s"
        }}>
            Meranos Nigeria Limited offers world-class technical and vocational education 
            at our training centers in Port Harcourt and Warri. Practical skills for real careers.
          </p>

          {/* Locations */}
          <div className="flex items-center justify-center gap-6 mb-10 animate-fade-up" style={{
          animationDelay: "0.25s"
        }}>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Port Harcourt</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-muted-foreground" />
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Warri</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{
          animationDelay: "0.3s"
        }}>
            <Link to="/auth?mode=signup">
              <Button size="lg" className="group bg-gradient-primary hover:opacity-90 px-8">
                Start Your Journey
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <a href="#programs">
              <Button variant="outline" size="lg" className="px-8">
                Explore Programs
              </Button>
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 pt-16 border-t border-border animate-fade-up" style={{
          animationDelay: "0.4s"
        }}>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-display font-bold text-primary mb-2">1000+</div>
              <div className="text-sm text-muted-foreground font-body">Trained Graduates</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-display font-bold text-primary mb-2">2</div>
              <div className="text-sm text-muted-foreground font-body">Training Centers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-display font-bold text-primary mb-2">92%</div>
              <div className="text-sm text-muted-foreground font-body">Employment Rate</div>
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default HeroSection;