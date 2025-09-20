import HeroSection from "@/components/HeroSection";
import ServiceRequest from "@/components/ServiceRequest";
import RepairCenters from "@/components/RepairCenters";
import JobTracking from "@/components/JobTracking";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <ServiceRequest />
      <JobTracking />
      <RepairCenters />
      <Footer />
    </main>
  );
};

export default Index;
