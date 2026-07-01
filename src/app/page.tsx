import CTA from "@/components/home/CTA";
import Features from "@/components/home/Features";
import Hero from "@/components/home/Hero";
import Pricing from "@/components/home/Pricing";


export default function Home() {
  return (
    <div>
      <Hero />
      <Features />
      <Pricing />
      <CTA />
    </div>
  );
}
