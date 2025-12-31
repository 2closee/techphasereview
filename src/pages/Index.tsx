import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import ProgramsSection from "@/components/landing/ProgramsSection";
import AboutSection from "@/components/landing/AboutSection";
import AdmissionsSection from "@/components/landing/AdmissionsSection";
import ContactSection from "@/components/landing/ContactSection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <ProgramsSection />
        <AboutSection />
        <AdmissionsSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
