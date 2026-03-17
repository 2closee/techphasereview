import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Award, ArrowRight, BookOpen, Code2, Cpu, Database, Network, Shield, Wrench } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

const colorAccents = [
  { border: "border-on-blue/30", bg: "bg-on-blue/10", text: "text-on-blue", icon: Code2 },
  { border: "border-on-orange/30", bg: "bg-on-orange/10", text: "text-on-orange", icon: Cpu },
  { border: "border-on-purple/30", bg: "bg-on-purple/10", text: "text-on-purple", icon: Database },
  { border: "border-on-green/30", bg: "bg-on-green/10", text: "text-on-green", icon: Network },
  { border: "border-on-red/30", bg: "bg-on-red/10", text: "text-on-red", icon: Shield },
  { border: "border-on-yellow/30", bg: "bg-on-yellow/10", text: "text-on-yellow", icon: Wrench },
];

const ProgramsSection = () => {
  const navigate = useNavigate();
  
  const { data: programs, isLoading } = useQuery({
    queryKey: ['active-programs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <section id="programs" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="font-mono text-primary font-medium text-sm uppercase tracking-wider">
            // our_programs
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mt-4 mb-6">
            Industry-Ready <span className="text-gradient-primary">Tech Courses</span>
          </h2>
          <p className="text-muted-foreground text-lg font-body">
            Practical, hands-on training programs designed to prepare you for real-world 
            technical careers in Nigeria's growing tech sector.
          </p>
        </div>

        {/* Programs Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <Skeleton className="h-12 w-12 rounded-xl mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : programs && programs.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program, index) => {
              const accent = colorAccents[index % colorAccents.length];
              const IconComp = accent.icon;
              return (
                <Card 
                  key={program.id} 
                  className={`group relative overflow-hidden border ${accent.border} bg-card hover:shadow-elevated transition-all duration-500 animate-fade-up`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardHeader className="pb-4">
                    {program.is_free_short_course && (
                      <div className="mb-3 -mt-1">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-on-green/15 text-on-green border border-on-green/30 uppercase tracking-wider">
                          🎓 3 Weeks Free
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl ${accent.bg}`}>
                        <IconComp className={`w-6 h-6 ${accent.text}`} />
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground font-mono">
                        <Clock className="w-4 h-4" />
                        {program.is_free_short_course ? '3 Weeks' : `${program.duration} ${program.duration_unit}`}
                      </div>
                    </div>
                    <CardTitle className="text-xl font-display">{program.name}</CardTitle>
                    <CardDescription className="font-body">{program.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Award className={`w-4 h-4 ${accent.text}`} />
                        <span className="text-sm font-medium text-foreground font-body">{program.category}</span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground font-body">
                          <span className="font-semibold text-foreground">Tuition:</span> {formatCurrency(Number(program.tuition_fee))}
                        </div>
                        {program.registration_fee && Number(program.registration_fee) > 0 && (
                          <div className="text-sm text-muted-foreground font-body">
                            <span className="font-semibold text-foreground">Registration:</span> {formatCurrency(Number(program.registration_fee))}
                          </div>
                        )}
                      </div>

                      {program.requirements && program.requirements.length > 0 && (
                        <ul className="space-y-2">
                          {program.requirements.slice(0, 3).map((req: string, i: number) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground font-body">
                              <div className={`w-1.5 h-1.5 rounded-full ${accent.bg.replace('/10', '')}`} />
                              {req}
                            </li>
                          ))}
                        </ul>
                      )}

                      <Button 
                        variant="outline" 
                        className={`w-full mt-4 ${accent.border} group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors`}
                        onClick={() => navigate(`/register?program_id=${program.id}`)}
                      >
                        Enroll Now
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-display font-semibold text-foreground mb-2">Programs Coming Soon</h3>
            <p className="text-muted-foreground font-body">
              We're currently preparing our course catalog. Check back soon!
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProgramsSection;