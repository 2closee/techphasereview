import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Monitor, Wrench, Database, Network, Clock, Award, ArrowRight } from "lucide-react";

const programs = [
  {
    id: 1,
    title: "Computer Hardware & Networking",
    description: "Master computer assembly, repair, troubleshooting, and network infrastructure setup and maintenance.",
    icon: Monitor,
    duration: "6 Months",
    certification: "Professional Certificate",
    features: ["PC Assembly & Repair", "Network Setup", "Troubleshooting", "Preventive Maintenance"],
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: 2,
    title: "Industrial Electrical/Electronics",
    description: "Learn electrical installations, electronics repair, and industrial automation systems.",
    icon: Wrench,
    duration: "9 Months",
    certification: "Advanced Certificate",
    features: ["Electrical Installation", "Electronics Repair", "PLC Basics", "Safety Standards"],
    color: "from-orange-500 to-amber-500",
  },
  {
    id: 3,
    title: "Database Administration",
    description: "Comprehensive training in database design, SQL, administration, and data management.",
    icon: Database,
    duration: "6 Months",
    certification: "Professional Certificate",
    features: ["SQL Programming", "Database Design", "Backup & Recovery", "Performance Tuning"],
    color: "from-purple-500 to-pink-500",
  },
  {
    id: 4,
    title: "Network Administration",
    description: "Enterprise networking, server administration, and cybersecurity fundamentals.",
    icon: Network,
    duration: "9 Months",
    certification: "Advanced Certificate",
    features: ["Server Administration", "Network Security", "Cloud Basics", "Virtualization"],
    color: "from-green-500 to-emerald-500",
  },
];

const ProgramsSection = () => {
  return (
    <section id="programs" className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider font-body">
            Our Programs
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mt-4 mb-6">
            Industry-Ready TVET Courses
          </h2>
          <p className="text-muted-foreground text-lg font-body">
            Practical, hands-on training programs designed to prepare you for real-world 
            technical careers in Nigeria's growing ICT sector.
          </p>
        </div>

        {/* Programs Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {programs.map((program, index) => (
            <Card 
              key={program.id} 
              className="group relative overflow-hidden border-border bg-card hover:shadow-elevated transition-all duration-500 animate-fade-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Gradient Accent */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${program.color}`} />
              
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${program.color} bg-opacity-10`}>
                    <program.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground font-body">
                    <Clock className="w-4 h-4" />
                    {program.duration}
                  </div>
                </div>
                <CardTitle className="text-xl font-display">{program.title}</CardTitle>
                <CardDescription className="font-body">{program.description}</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground font-body">{program.certification}</span>
                  </div>
                  
                  <ul className="space-y-2">
                    {program.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground font-body">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button variant="outline" className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    Learn More
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProgramsSection;