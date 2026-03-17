import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, GraduationCap, MapPin, Clock, Sparkles } from "lucide-react";

const FreeCourseBanner = () => {
  return (
    <section className="relative py-16 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/20 to-primary/10" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Left content */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30 mb-4">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Limited Offer</span>
              </div>

              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                Free 3-Week{" "}
                <span className="text-gradient-primary">ICT Short Course</span>
              </h2>

              <p className="text-muted-foreground font-body mb-6 max-w-lg">
                Start your tech journey with zero fees! Our introductory course at the Warri
                Training Center covers computer literacy, internet fundamentals, and digital skills.
              </p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>Warri Center Only</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>3 Weeks Duration</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <GraduationCap className="w-4 h-4 text-primary" />
                  <span>No Fees Required</span>
                </div>
              </div>

              <Link to="/free-course">
                <Button size="lg" className="bg-gradient-primary hover:opacity-90 px-8 group">
                  Register for Free
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            {/* Right decorative card */}
            <div className="shrink-0">
              <div className="relative w-64 h-64 md:w-72 md:h-72">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/30 rounded-3xl rotate-6" />
                <div className="absolute inset-0 bg-card border border-border rounded-3xl shadow-lg flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <GraduationCap className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-4xl font-display font-bold text-primary mb-1">₦0</p>
                  <p className="text-sm text-muted-foreground font-body mb-3">Completely Free</p>
                  <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                    3 WEEKS • WARRI
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FreeCourseBanner;
