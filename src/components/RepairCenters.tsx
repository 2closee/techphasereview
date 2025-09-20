import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type RepairCenter = Tables<"Repair Center">;

const RepairCenters = () => {
  const [repairCenters, setRepairCenters] = useState<RepairCenter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRepairCenters = async () => {
      try {
        const { data, error } = await supabase
          .from("Repair Center")
          .select("*");

        if (error) throw error;
        setRepairCenters(data || []);
      } catch (error) {
        console.error("Error fetching repair centers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRepairCenters();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-1/3 mx-auto mb-4"></div>
              <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Our Repair Centers
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Professional repair centers in your area, equipped with the latest tools and staffed by certified technicians
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {repairCenters.map((center) => (
            <Card key={center.id} className="shadow-card hover:shadow-elegant transition-smooth">
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <span className="text-lg">{center.name}</span>
                  <Badge variant="secondary" className="ml-2">
                    Certified
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Professional appliance repair services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {center.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{center.address}</span>
                  </div>
                )}

                {center.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{center.phone}</span>
                  </div>
                )}

                {center.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{center.email}</span>
                  </div>
                )}

                {center.hours && (
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{center.hours}</span>
                  </div>
                )}

                {center.specialties && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground">Specialties</h4>
                    <div className="flex flex-wrap gap-1">
                      {center.specialties.split(',').map((specialty, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {specialty.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  <Button variant="outline" className="w-full">
                    Contact Center
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {repairCenters.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No repair centers found. Please check back later.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default RepairCenters;