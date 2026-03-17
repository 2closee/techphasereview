import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, CreditCard, GraduationCap, ArrowRight, CheckCircle, MapPin } from "lucide-react";

const steps = [
  {
    step: 1,
    title: "Pick Your Track",
    description: "Choose your preferred training center and program of study.",
    icon: MapPin,
    color: "text-on-blue",
    bg: "bg-on-blue/10",
    border: "border-on-blue/20",
  },
  {
    step: 2,
    title: "Apply Online",
    description: "Complete our streamlined application with your details.",
    icon: FileText,
    color: "text-on-orange",
    bg: "bg-on-orange/10",
    border: "border-on-orange/20",
  },
  {
    step: 3,
    title: "Get Enrolled",
    description: "Complete assessment and secure your spot with registration.",
    icon: CheckCircle,
    color: "text-on-green",
    bg: "bg-on-green/10",
    border: "border-on-green/20",
  },
  {
    step: 4,
    title: "Start Building",
    description: "Begin hands-on training and start building real projects.",
    icon: GraduationCap,
    color: "text-on-purple",
    bg: "bg-on-purple/10",
    border: "border-on-purple/20",
  },
];

const AdmissionsSection = () => {
  return (
    <section id="admissions" className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="font-mono text-primary font-medium text-sm uppercase tracking-wider">
            // how_to_join
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mt-4 mb-6">
            Your Path to <span className="text-gradient-primary">Tech Success</span>
          </h2>
          <p className="text-muted-foreground text-lg font-body">
            Four simple steps to start your tech career. Our team guides you through every step.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {steps.map((item, index) => (
            <Card 
              key={item.step} 
              className={`bg-card border ${item.border} animate-fade-up hover:shadow-soft transition-shadow`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-10 h-10 rounded-full ${item.bg} flex items-center justify-center font-mono font-bold ${item.color}`}>
                    {item.step}
                  </div>
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <CardTitle className="text-lg font-display text-foreground">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground font-body">
                  {item.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-muted-foreground mb-6 font-body">
            Ready to launch your tech career? Apply now — our admissions team responds within 48 hours.
          </p>
          <Link to="/register">
            <Button size="lg" className="group bg-gradient-primary hover:opacity-90 px-8 text-primary-foreground shadow-glow">
              Apply for Enrollment
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AdmissionsSection;