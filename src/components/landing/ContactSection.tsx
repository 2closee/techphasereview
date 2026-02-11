import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSettings } from "@/contexts/SettingsContext";

const ContactSection = () => {
  const { settings } = useSettings();

  const contactInfo = [
    {
      icon: MapPin,
      title: "Our Location",
      details: settings.contact_address,
    },
    {
      icon: Phone,
      title: "Call Us",
      details: settings.contact_phone,
    },
    {
      icon: Mail,
      title: "Email Us",
      details: settings.contact_email,
    },
    {
      icon: Clock,
      title: "Office Hours",
      details: "Mon - Fri: 8:00 AM - 5:00 PM",
    },
  ];

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Thank you! We'll get back to you within 24 hours.");
    setFormData({ name: "", email: "", phone: "", message: "" });
  };

  return (
    <section id="contact" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider font-body">
            Get In Touch
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mt-4 mb-6">
            Have Questions? <span className="text-gradient-primary">Let's Talk</span>
          </h2>
          <p className="text-muted-foreground text-lg font-body">
            Our admissions team is here to help. Reach out with any questions about our
            programs, fees, or enrollment process.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-4">
            {contactInfo.map((item, index) => (
              <Card
                key={item.title + index}
                className="border-border bg-card hover:shadow-soft transition-shadow animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-display mb-1">{item.title}</CardTitle>
                    <p className="text-muted-foreground font-body text-sm">{item.details}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Contact Form */}
          <Card className="border-border shadow-elevated animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <CardHeader>
              <CardTitle className="font-display text-2xl">Send us a Message</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground font-body mb-2 block">Full Name</label>
                    <Input placeholder="John Doe" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="bg-background" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground font-body mb-2 block">Email Address</label>
                    <Input type="email" placeholder="john@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="bg-background" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground font-body mb-2 block">Phone Number</label>
                  <Input placeholder="+234 (0) 123 456 7890" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="bg-background" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground font-body mb-2 block">Message</label>
                  <Textarea placeholder="Tell us about your interests and how we can help..." value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} required rows={4} className="bg-background resize-none" />
                </div>
                <Button size="lg" className="w-full group bg-gradient-primary hover:opacity-90">
                  Send Message
                  <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
