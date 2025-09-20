import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ServiceRequest = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    pickupAddress: "",
    applianceType: "",
    applianceBrand: "",
    applianceModel: "",
    issueDescription: "",
  });

  const applianceTypes = [
    "Refrigerator",
    "Washing Machine",
    "Dryer",
    "Dishwasher",
    "Oven",
    "Microwave",
    "Air Conditioner",
    "Other"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("repair_jobs").insert({
        customer_name: formData.customerName,
        customer_email: formData.customerEmail,
        customer_phone: formData.customerPhone,
        pickup_address: formData.pickupAddress,
        appliance_type: formData.applianceType,
        appliance_brand: formData.applianceBrand || null,
        appliance_model: formData.applianceModel || null,
        issue_description: formData.issueDescription,
        repair_center_id: 1, // Default to first repair center for now
        user_id: "temp-user-id", // In a real app, this would come from auth
      });

      if (error) throw error;

      toast({
        title: "Service Request Submitted!",
        description: "We'll contact you within 24 hours to schedule pickup.",
      });

      // Reset form
      setFormData({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        pickupAddress: "",
        applianceType: "",
        applianceBrand: "",
        applianceModel: "",
        issueDescription: "",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <section className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Request Repair Service
            </h2>
            <p className="text-lg text-muted-foreground">
              Fill out the form below and we'll get your appliance fixed in no time
            </p>
          </div>

          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Service Request Form</CardTitle>
              <CardDescription>
                Provide details about your appliance and the issue you're experiencing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Full Name *</Label>
                    <Input
                      id="customerName"
                      value={formData.customerName}
                      onChange={(e) => handleInputChange("customerName", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerEmail">Email Address *</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => handleInputChange("customerEmail", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Phone Number *</Label>
                    <Input
                      id="customerPhone"
                      type="tel"
                      value={formData.customerPhone}
                      onChange={(e) => handleInputChange("customerPhone", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="applianceType">Appliance Type *</Label>
                    <Select value={formData.applianceType} onValueChange={(value) => handleInputChange("applianceType", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select appliance type" />
                      </SelectTrigger>
                      <SelectContent>
                        {applianceTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pickupAddress">Pickup Address *</Label>
                  <Textarea
                    id="pickupAddress"
                    value={formData.pickupAddress}
                    onChange={(e) => handleInputChange("pickupAddress", e.target.value)}
                    placeholder="Enter your full address for appliance pickup"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="applianceBrand">Brand (Optional)</Label>
                    <Input
                      id="applianceBrand"
                      value={formData.applianceBrand}
                      onChange={(e) => handleInputChange("applianceBrand", e.target.value)}
                      placeholder="e.g., Samsung, LG, Whirlpool"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="applianceModel">Model (Optional)</Label>
                    <Input
                      id="applianceModel"
                      value={formData.applianceModel}
                      onChange={(e) => handleInputChange("applianceModel", e.target.value)}
                      placeholder="Model number if available"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="issueDescription">Issue Description *</Label>
                  <Textarea
                    id="issueDescription"
                    value={formData.issueDescription}
                    onChange={(e) => handleInputChange("issueDescription", e.target.value)}
                    placeholder="Describe the problem with your appliance in detail"
                    rows={4}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  variant="gradient" 
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Submitting..." : "Submit Service Request"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ServiceRequest;