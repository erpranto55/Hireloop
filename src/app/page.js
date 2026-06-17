import CTA from "@/components/home/CTA";
import Hero from "@/components/home/Hero";
import Footer from "@/components/shared/Footer";
import NavBar from "@/components/shared/NavBar";
import Image from "next/image";

export default function Home() {
  return (
    <div>
      <Hero />

      <CTA />
    </div>
  );
}
