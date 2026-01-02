import { Users, Trophy, Building, Globe } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Expert Instructors",
    description: "Learn from industry professionals with years of hands-on experience in ICT and engineering.",
  },
  {
    icon: Building,
    title: "Modern Facilities",
    description: "Train in well-equipped labs with industry-standard hardware, software, and networking equipment.",
  },
  {
    icon: Trophy,
    title: "Industry Recognition",
    description: "Our certifications are recognized by employers across Nigeria and the broader African market.",
  },
  {
    icon: Globe,
    title: "Career Placement",
    description: "Strong industry connections and job placement support to help you launch your tech career.",
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
              About Meranos
            </span>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mt-4 mb-6">
              Empowering Nigeria's <span className="text-gradient-primary">Tech Workforce</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 font-body leading-relaxed">
              Meranos Nigeria Limited is a leading ICT consultancy firm with a mission to bridge 
              the skills gap in Nigeria's technology sector. Through our TVET centers in Port Harcourt 
              and Warri, we provide practical, industry-relevant training.
            </p>
            <p className="text-muted-foreground font-body leading-relaxed mb-8">
              Our approach combines theoretical knowledge with extensive hands-on practice. 
              Every trainee graduates with real-world experience and the skills employers are looking for.
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
                  <h3 className="text-xl font-display font-bold text-foreground mb-2">Our Training Centers</h3>
                  <p className="text-muted-foreground font-body text-sm">
                    State-of-the-art facilities in Port Harcourt & Warri
                  </p>
                </div>
              </div>
              
              {/* Floating Card */}
              <div className="absolute -bottom-6 -left-6 bg-card p-6 rounded-xl shadow-elevated border border-border animate-float">
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-display font-bold text-primary">15+</div>
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