import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import AssuranceBand from "@/components/AssuranceBand";
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
        <AssuranceBand />
        <Problem />
        <FitSection />
        <Testimonials />
        <CostReason />
        <Portfolio />
        <Plans />
        <AddOns />
        <TrustPromise />
        <Process />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
