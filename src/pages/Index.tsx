import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StatsBar from "@/components/StatsBar";
import AboutSection from "@/components/AboutSection";
import ProductsSection from "@/components/ProductsSection";
import ServicesSection from "@/components/ServicesSection";
import CustomDevSection from "@/components/CustomDevSection";
import WhyChooseUs from "@/components/WhyChooseUs";
import ProcessSection from "@/components/ProcessSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import FAQSection from "@/components/FAQSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

const Index = () => (
  <div className="min-h-screen overflow-x-hidden">
    <Navbar />
    <HeroSection />
    <AboutSection />
    <ProductsSection />
    <ServicesSection />
    <CustomDevSection />
    <WhyChooseUs />
    <ProcessSection />
    <TestimonialsSection />
    <FAQSection />
    <StatsBar />
    <ContactSection />
    <Footer />
  </div>
);

export default Index;
