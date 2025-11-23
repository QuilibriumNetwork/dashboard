import { Button } from "@/components/ui/Button";
import { homeHeaderIcons } from "@/components/floatingicons/iconSets";
import FloatingIcons from "@/components/floatingicons/FloatingIcons";
import ParticlesAnimationDiv from "@/components/ui/ParticleAnimationsDiv";

export const Hero = () => {
  return (
    <section className="overflow-hidden bg-burgundy-pink-4 py-16 pb-6 md:pb-10 lg:py-0 lg:pt-16">
      <div className="lg:container">
        <div className="flex flex-col lg:flex-row lg:flex justify-between lg:gap-6">
          <div className="max-lg:-mt-28 max-lg:container grid gap-6 lg:gap-10 order-2 lg:order-1 pb-8 md:pb-10 lg:pb-44 lg:py-28">
            <div className="grid gap-1 lg:gap-4 max-lg:pr-12 mt-6 min-[640px]:max-lg:-mt-[100px]">
              <h1 className="gradient-sweep--dark text-[56px] lg:text-[80px] tracking-[-1.12px] lg:tracking-[-2px] leading-none">
                Internet, Reborn.
              </h1>
              <p className="lg:max-w-[652px] text-beige text-base lg:text-xl leading-7 lg:leading-8">
                {" "}
                Q is a next-generation decentralized network designed to secure
                every bit of internet traffic. With built-in end-to-end
                encryption, the simplicity of the Cloud, and massive
                scalability, Q aims to become the internet of the future.
              </p>
            </div>
            <div className="flex">
              <Button
                asChild
                variant="primary"
                size="default"
                className="w-full md:w-auto lg:px-8 lg:py-4 lg:text-lg"
              >
                <a href="#discover-build-run" className="scroll-smooth">
                  {`Let's Go!`}
                </a>
              </Button>
            </div>
          </div>
          <div className="h-auto relative w-full min-h-[350px] sm:min-h-[700px] md:min-h-[900px] lg:min-h-[700px] lg:max-w-[500px] flex items-center justify-center order-1 lg:order-2 z-10">
            <FloatingIcons
              containerClassName="absolute max-lg:translate-y-[-30%] lg:static w-[80%] min-[640px]:max-lg:w-[70%] lg:w-full h-auto"
              icons={homeHeaderIcons}
              loading="eager"
            />
            <div className="z-[-1] lg:absolute w-full lg:w-auto lg:h-full left-1/2 top-1/2 lg:-translate-y-1/2 lg:-translate-x-1/2 min-[640px]:max-lg:mt-10">
              <ParticlesAnimationDiv
                className="hidden lg:block"
                svgContainerId="pa--svg-header-container"
                svgPath="/svg/home-header.svg"
                svgId="home-header-svg"
                particleClass="pa--particle-glow--white"
              />
              <ParticlesAnimationDiv
                className="lg:hidden"
                svgContainerId="pa--svg-header-mobile-container"
                svgPath="/svg/home-header-mobile.svg"
                svgId="home-header-mobile-svg"
                particleClass="pa--particle-glow--white"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
