import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Wrench, Phone, Mail, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gradient-hero text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Wrench className="h-8 w-8 text-primary-glow" />
              <h3 className="text-2xl font-bold">QuickRepair</h3>
            </div>
            <p className="text-white/80 mb-4 max-w-md">
              Professional appliance repair service with same-day availability, 
              licensed technicians, and guaranteed satisfaction for all your home appliances.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white/80">
                <Phone className="h-4 w-4" />
                <span>1-800-REPAIR-1</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <Mail className="h-4 w-4" />
                <span>support@quickrepair.com</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-white/80">
              <li>Refrigerator Repair</li>
              <li>Washing Machine Repair</li>
              <li>Dryer Repair</li>
              <li>Dishwasher Repair</li>
              <li>Oven & Range Repair</li>
              <li>Microwave Repair</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-white/80">
              <li>About Us</li>
              <li>Our Technicians</li>
              <li>Service Areas</li>
              <li>Warranty</li>
              <li>Contact</li>
              <li>Reviews</li>
            </ul>
          </div>
        </div>

        <Separator className="bg-white/20 mb-8" />

        <div className="flex flex-col md:flex-row justify-between items-center text-white/80">
          <p>&copy; 2024 QuickRepair. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <span className="hover:text-white cursor-pointer">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;