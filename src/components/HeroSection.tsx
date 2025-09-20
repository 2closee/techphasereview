import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Wrench, Shield, Clock, Star } from "lucide-react";
import heroImage from "@/assets/hero-appliance-repair.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen bg-gradient-subtle overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Professional appliance repair service" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-hero/90"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20 lg:py-32">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Expert Appliance
            <span className="block bg-gradient-to-r from-primary-glow to-white bg-clip-text text-transparent">
              Repair Service
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto leading-relaxed">
            Fast, reliable repairs for all your home appliances. Professional technicians, 
            transparent pricing, and guaranteed satisfaction.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button variant="hero" size="xl" className="text-lg">
              <Wrench className="mr-2 h-5 w-5" />
              Request Repair
            </Button>
            <Button variant="outline" size="xl" className="text-lg bg-white/10 border-white/30 text-white hover:bg-white/20">
              <Star className="mr-2 h-5 w-5" />
              View Centers
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20 text-center">
              <Shield className="h-12 w-12 text-primary-glow mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Licensed & Insured</h3>
              <p className="text-white/80">Fully certified technicians you can trust</p>
            </Card>
            
            <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20 text-center">
              <Clock className="h-12 w-12 text-primary-glow mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Same Day Service</h3>
              <p className="text-white/80">Quick response times when you need us most</p>
            </Card>
            
            <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20 text-center">
              <Star className="h-12 w-12 text-primary-glow mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Satisfaction Guaranteed</h3>
              <p className="text-white/80">Quality repairs backed by our warranty</p>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;