import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Package, Wrench, CheckCircle, Truck, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";

type RepairJob = Tables<"repair_jobs">;

const JobTracking = () => {
  const [jobs, setJobs] = useState<RepairJob[]>([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "requested":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "pickup_scheduled":
      case "picked_up":
        return <Truck className="h-5 w-5 text-orange-500" />;
      case "in_repair":
        return <Wrench className="h-5 w-5 text-purple-500" />;
      case "repair_completed":
      case "ready_for_return":
        return <Package className="h-5 w-5 text-green-500" />;
      case "returned":
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "requested":
        return "bg-blue-100 text-blue-800";
      case "pickup_scheduled":
      case "picked_up":
        return "bg-orange-100 text-orange-800";
      case "in_repair":
        return "bg-purple-100 text-purple-800";
      case "repair_completed":
      case "ready_for_return":
        return "bg-green-100 text-green-800";
      case "returned":
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const searchJobs = async () => {
    if (!searchEmail.trim()) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("repair_jobs")
        .select("*")
        .eq("customer_email", searchEmail.toLowerCase().trim())
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Track Your Repair
            </h2>
            <p className="text-lg text-muted-foreground">
              Enter your email address to check the status of your repair jobs
            </p>
          </div>

          <Card className="shadow-elegant mb-8">
            <CardHeader>
              <CardTitle>Job Search</CardTitle>
              <CardDescription>
                Enter the email address used when requesting service
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="email" className="sr-only">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchJobs()}
                  />
                </div>
                <Button onClick={searchJobs} disabled={loading || !searchEmail.trim()}>
                  {loading ? "Searching..." : "Search Jobs"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {jobs.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-foreground">Your Repair Jobs</h3>
              {jobs.map((job) => (
                <Card key={job.id} className="shadow-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-3">
                        {getStatusIcon(job.job_status)}
                        {job.appliance_type} Repair
                      </CardTitle>
                      <Badge className={getStatusColor(job.job_status)}>
                        {formatStatus(job.job_status)}
                      </Badge>
                    </div>
                    <CardDescription>
                      Job #{job.id.slice(0, 8)} • Submitted {format(new Date(job.created_at), 'MMM d, yyyy')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-1">Appliance Details</h4>
                        <p className="text-sm">
                          {job.appliance_brand ? `${job.appliance_brand} ` : ''}{job.appliance_type}
                          {job.appliance_model ? ` (${job.appliance_model})` : ''}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-1">Pickup Address</h4>
                        <p className="text-sm">{job.pickup_address}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Issue Description</h4>
                      <p className="text-sm">{job.issue_description}</p>
                    </div>

                    {job.estimated_cost && (
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-1">Estimated Cost</h4>
                        <p className="text-sm font-semibold">${job.estimated_cost}</p>
                      </div>
                    )}

                    {job.pickup_date && (
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-1">Pickup Date</h4>
                        <p className="text-sm">{format(new Date(job.pickup_date), 'MMM d, yyyy')}</p>
                      </div>
                    )}

                    {job.completion_date && (
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-1">Completion Date</h4>
                        <p className="text-sm">{format(new Date(job.completion_date), 'MMM d, yyyy')}</p>
                      </div>
                    )}

                    {job.notes && (
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-1">Notes</h4>
                        <p className="text-sm">{job.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {searchEmail && jobs.length === 0 && !loading && (
            <Card className="shadow-card">
              <CardContent className="py-12 text-center">
                <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Jobs Found</h3>
                <p className="text-muted-foreground">
                  We couldn't find any repair jobs associated with this email address.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
};

export default JobTracking;