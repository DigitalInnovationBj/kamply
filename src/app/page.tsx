import { Island } from "@/components/Island";
import { Choreography } from "@/components/Choreography";
import { Hero } from "@/components/sections/Hero";
import { StepPaste, StepWrite } from "@/components/sections/Steps";
import { Channels } from "@/components/sections/Channels";
import { Results } from "@/components/sections/Results";
import { PricingSection, FaqSection, OnAir } from "@/components/sections/Closing";

export default function Home() {
  return (
    <>
      <Island />
      <main>
        <Hero />
        <StepPaste />
        <StepWrite />
        <Channels />
        <Results />
        <PricingSection />
        <FaqSection />
        <OnAir />
      </main>
      <Choreography />
    </>
  );
}
