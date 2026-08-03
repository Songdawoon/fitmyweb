import Nav from "@/components/Nav";
import { authEnabled } from "@/lib/auth";
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
import LaunchPopup from "@/components/LaunchPopup";
import KakaoFloat from "@/components/KakaoFloat";

export default function Home() {
  return (
    <>
      <Nav authEnabled={authEnabled()} />
      <main>
        {/* 섹션 순서는 고객의 결정 순서를 따른다.
            문제 → 해결 → 증거 → 조건 → 행동.
            후기(증거)를 플랜(해결) 앞에 두면 아직 무엇을 파는지 모르는
            상태에서 남의 만족을 먼저 읽게 된다. */}
        <Hero />
        <AssuranceBand />
        {/* 문제 */}
        <Problem />
        {/* 해결 */}
        <FitSection />
        <CostReason />
        <Plans />
        <AddOns />
        {/* 증거 */}
        <Portfolio />
        <Testimonials />
        {/* 조건 */}
        <TrustPromise />
        <Process />
        <FAQ />
        {/* 행동 */}
        <FinalCTA />
      </main>
      <Footer />
      <LaunchPopup />
      <KakaoFloat />
    </>
  );
}
