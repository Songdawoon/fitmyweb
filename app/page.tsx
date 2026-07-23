import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Problem from "@/components/Problem";
import FitSection from "@/components/FitSection";
import CostReason from "@/components/CostReason";
import Process from "@/components/Process";
import Portfolio from "@/components/Portfolio";
import Plans from "@/components/Plans";
import AddOns from "@/components/AddOns";
import TrustPromise from "@/components/TrustPromise";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Problem />
        <FitSection />
        <CostReason />
        <Process />
        <Portfolio />
        <Plans />
        <AddOns />
        <TrustPromise />
        <Testimonials />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
