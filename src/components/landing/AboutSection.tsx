import { Users, Trophy, Building, Globe } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Expert Faculty",
    description: "Learn from industry veterans with decades of experience in culinary and fashion industries.",
  },
  {
    icon: Building,
    title: "Modern Facilities",
    description: "Train in fully-equipped kitchens, design studios, and computer labs with the latest technology.",
  },
  {
    icon: Trophy,
    title: "Industry Recognition",
    description: "Our certifications are recognized by leading employers in Nigeria and internationally.",
  },
  {
    icon: Globe,
    title: "Global Network",
    description: "Connect with alumni working at top restaurants, fashion houses, and design studios worldwide.",
  },
];

const AboutSection = () => {
  return (
    <section id="about" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content Side */}
          <div>
            <span className="text-primary font-semibold text-sm uppercase tracking-wider font-body">
              About Topearl
            </span>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mt-4 mb-6">
              Where Passion Meets <span className="text-gradient-gold">Excellence</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 font-body leading-relaxed">
              Founded with a vision to nurture Nigeria's creative talents, Topearl International Institute 
              has become a leading destination for aspiring culinary artists and fashion designers. 
              Our holistic approach combines traditional techniques with modern innovation.
            </p>
            <p className="text-muted-foreground font-body leading-relaxed mb-8">
              We believe in hands-on learning, industry immersion, and personal mentorship. 
              Every student receives individualized attention to help them discover and develop 
              their unique creative voice.
            </p>

            {/* Features Grid */}
            <div className="grid sm:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div 
                  key={feature.title} 
                  className="flex gap-4 p-4 rounded-xl bg-muted/50 border border-border hover:border-primary/30 transition-colors animate-fade-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1 font-body">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground font-body">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Image Side */}
          <div className="relative">
            <div className="relative z-10">
              {/* Main Image Placeholder */}
              <div className="aspect-[4/5] rounded-2xl bg-gradient-to-br from-muted to-accent overflow-hidden shadow-elevated">
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-primary/30 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-display font-bold text-foreground mb-2">Our Campus</h3>
                  <p className="text-muted-foreground font-body text-sm">
                    State-of-the-art facilities designed for creative excellence
                  </p>
                </div>
              </div>
              
              {/* Floating Card */}
              <div className="absolute -bottom-6 -left-6 bg-card p-6 rounded-xl shadow-elevated border border-border animate-float">
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-display font-bold text-primary">10+</div>
                  <div className="text-sm text-muted-foreground font-body">
                    Years of<br />Excellence
                  </div>
                </div>
              </div>
            </div>

            {/* Background Decoration */}
            <div className="absolute -top-8 -right-8 w-full h-full border-2 border-primary/20 rounded-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
