import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, CreditCard, GraduationCap, ArrowRight, CheckCircle } from "lucide-react";

const steps = [
  {
    step: 1,
    title: "Submit Application",
    description: "Complete our online application form with your personal details and program preference.",
    icon: FileText,
  },
  {
    step: 2,
    title: "Review & Interview",
    description: "Our admissions team reviews your application and schedules an interview if needed.",
    icon: CheckCircle,
  },
  {
    step: 3,
    title: "Pay Tuition",
    description: "Secure your spot with flexible payment options including installment plans.",
    icon: CreditCard,
  },
  {
    step: 4,
    title: "Begin Training",
    description: "Start your journey with orientation and dive into your chosen program.",
    icon: GraduationCap,
  },
];

const AdmissionsSection = () => {
  return (
    <section id="admissions" className="py-24 bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider font-body">
            Admissions
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mt-4 mb-6">
            Your Path to <span className="text-primary">Success</span> Starts Here
          </h2>
          <p className="text-secondary-foreground/70 text-lg font-body">
            Join our community of aspiring professionals. The application process is simple 
            and our team is here to guide you every step of the way.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {steps.map((item, index) => (
            <Card 
              key={item.step} 
              className="bg-secondary-foreground/5 border-secondary-foreground/10 text-secondary-foreground animate-fade-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold font-body">
                    {item.step}
                  </div>
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg font-display text-secondary-foreground">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-secondary-foreground/60 font-body">
                  {item.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-secondary-foreground/70 mb-6 font-body">
            Ready to take the first step? Apply now and our admissions team will be in touch within 48 hours.
          </p>
          <Link to="/auth?mode=signup">
            <Button variant="gold" size="xl" className="group">
              Apply for Admission
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AdmissionsSection;
