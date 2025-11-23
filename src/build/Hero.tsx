import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { buildHeaderIcons } from "@/components/floatingicons/iconSets";
import FloatingIcons from "@/components/floatingicons/FloatingIcons";
import ParticlesAnimationDiv from "@/components/ui/ParticleAnimationsDiv";
import { useNavbarVariant } from "@/components/helpers/NavbarContext";

export const Hero = () => {
  const { setVariant } = useNavbarVariant();

  useEffect(() => {
    setVariant("transparent-burgundy");
    return () => setVariant(undefined);
  }, [setVariant]);

  return (
    <section className="overflow-hidden bg-white-beige py-16 pb-6 md:pb-10 lg:py-0 lg:pt-16">
      <div className="lg:container">
        <div className="flex flex-col lg:flex-row lg:flex justify-between lg:gap-6">
          <div className="max-lg:-mt-28 max-lg:container grid gap-6 lg:gap-10 order-2 lg:order-1 pb-8 md:pb-10 lg:pb-44 lg:py-28">
            <div className="grid gap-1 lg:gap-2 max-lg:pr-12 mt-6 min-[640px]:max-lg:-mt-[100px]">
              <h1 className="gradient-sweep break-words max-w-[90vw] text-[46px] sm:text-[56px] lg:text-[80px] tracking-[-1.12px] lg:tracking-[-2px] leading-none pb-2">
                Create<br/>Without Limits.
              </h1>
              <p className="lg:max-w-[652px] text-burgundy/90 text-base lg:text-xl leading-7 lg:leading-8">
                Build applications where scalability and privacy aren't an
                afterthought. Quilibrium replaces fragile chains and centralized
                clouds with encrypted, unstoppable infrastructure.
              </p>
            </div>
            <div className="flex max-w-[90vw]">
              <Button
                asChild
                variant="primary"
                size="default"
                className="w-full md:w-auto lg:px-8 lg:py-4 lg:text-lg"
              >
                <a href="#build-features" className="scroll-smooth">
                  {`Let's Go!`}
                </a>
              </Button>
            </div>
          </div>
          <div className="h-auto relative w-full lg:max-w-[500px] min-h-[350px] sm:min-h-[700px] md:min-h-[900px] lg:min-h-[700px] flex items-center justify-center order-1 lg:order-2 z-10">
            <FloatingIcons
              containerClassName="absolute max-lg:translate-y-[-30%] lg:static w-[80%] min-[640px]:max-lg:w-[70%] lg:w-full h-auto lg:mb-20"
              icons={buildHeaderIcons}
              loading="eager"
            />
            <div className="z-[-1] lg:absolute w-full lg:w-auto lg:h-full left-1/2 top-1/2 lg:-translate-y-1/2 lg:-translate-x-1/2 min-[640px]:max-lg:mt-10">
              <ParticlesAnimationDiv
                className="hidden lg:block"
                svgContainerId="pa--svg-header-container"
                svgPath="/svg/qconsole-header.svg"
                svgId="qconsole-header-svg"
                particleClass="pa--particle-glow--pink"
              />
              <ParticlesAnimationDiv
                className="lg:hidden"
                svgContainerId="pa--svg-header-mobile-container"
                svgPath="/svg/qconsole-header-mobile.svg"
                svgId="qconsole-header-mobile"
                particleClass="pa--particle-glow--pink"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
