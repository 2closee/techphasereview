import { Users, Trophy, Building, Globe, Terminal, Laptop, Zap, Code2 } from "lucide-react";

const features = [
  {
    icon: Terminal,
    title: "Hands-On Labs",
    description: "Learn by doing in fully-equipped tech labs with real-world projects and industry tools.",
    color: "text-on-blue",
    bg: "bg-on-blue/10",
  },
  {
    icon: Users,
    title: "Expert Mentors",
    description: "Industry professionals who've built real products guide you through every step.",
    color: "text-on-orange",
    bg: "bg-on-orange/10",
  },
  {
    icon: Trophy,
    title: "Industry Certs",
    description: "Earn recognized certifications that employers trust across Nigeria and beyond.",
    color: "text-on-green",
    bg: "bg-on-green/10",
  },
  {
    icon: Zap,
    title: "Job Placement",
    description: "Strong industry connections and career support to launch your tech career fast.",
    color: "text-on-purple",
    bg: "bg-on-purple/10",
  },
];

const AboutSection = () => {
  return (
    <section id="about" className="py-24 bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content Side */}
          <div>
            <span className="font-mono text-primary font-medium text-sm uppercase tracking-wider">
              // about_us
            </span>
            <h2 className="text-3xl md:text-5xl font-display font-bold mt-4 mb-6">
              Building Nigeria's <span className="text-gradient-rainbow">Next-Gen Tech Talent</span>
            </h2>
            <p className="text-secondary-foreground/60 text-lg mb-8 font-body leading-relaxed">
              Onlinnodes is a leading ICT training hub bridging the skills gap in Nigeria's 
              technology sector. Through our TVET centers in Port Harcourt and Warri, we provide 
              practical, industry-relevant training that gets results.
            </p>

            {/* Features Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div 
                  key={feature.title} 
                  className="flex gap-4 p-4 rounded-xl bg-secondary-foreground/5 border border-secondary-foreground/10 hover:border-primary/30 transition-colors animate-fade-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-lg ${feature.bg} flex items-center justify-center`}>
                      <feature.icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary-foreground mb-1 font-display text-sm">{feature.title}</h3>
                    <p className="text-xs text-secondary-foreground/50 font-body">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side — Terminal Style */}
          <div className="relative">
            <div className="relative z-10">
              <div className="rounded-2xl bg-secondary-foreground/5 border border-secondary-foreground/10 overflow-hidden shadow-elevated">
                {/* Terminal header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-secondary-foreground/10 bg-secondary-foreground/5">
                  <div className="w-3 h-3 rounded-full bg-on-red/60" />
                  <div className="w-3 h-3 rounded-full bg-on-yellow/60" />
                  <div className="w-3 h-3 rounded-full bg-on-green/60" />
                  <span className="ml-2 text-xs font-mono text-secondary-foreground/40">onlinnodes-academy.sh</span>
                </div>
                {/* Terminal body */}
                <div className="p-6 space-y-4 font-mono text-sm">
                  <div>
                    <span className="text-on-green">$ </span>
                    <span className="text-secondary-foreground/70">cat stats.json</span>
                  </div>
                  <div className="pl-2 space-y-2 text-secondary-foreground/50">
                    <div>{"{"}</div>
                    <div className="pl-4">
                      <span className="text-on-blue">"graduates"</span>: <span className="text-on-orange">1000</span>,
                    </div>
                    <div className="pl-4">
                      <span className="text-on-blue">"centers"</span>: <span className="text-on-orange">2</span>,
                    </div>
                    <div className="pl-4">
                      <span className="text-on-blue">"employment_rate"</span>: <span className="text-on-green">"92%"</span>,
                    </div>
                    <div className="pl-4">
                      <span className="text-on-blue">"years_active"</span>: <span className="text-on-orange">15</span>
                    </div>
                    <div>{"}"}</div>
                  </div>
                  <div>
                    <span className="text-on-green">$ </span>
                    <span className="text-secondary-foreground/70">echo "Ready to learn?"</span>
                  </div>
                  <div className="text-on-yellow">Ready to learn? ✓</div>
                </div>
              </div>
              
              {/* Floating badge */}
              <div className="absolute -bottom-4 -left-4 bg-card p-4 rounded-xl shadow-elevated border border-border animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-on-green/10 flex items-center justify-center">
                    <Code2 className="w-5 h-5 text-on-green" />
                  </div>
                  <div>
                    <div className="text-2xl font-display font-bold text-foreground">15+</div>
                    <div className="text-xs text-muted-foreground font-body">Years of Excellence</div>
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

export default AboutSection;