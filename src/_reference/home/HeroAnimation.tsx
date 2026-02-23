import ParticlesAnimationDiv from "@/components/ui/ParticleAnimationsDiv";
import Reveal from "@/components/ui/Reveal";

export const HeroAnimation = () => {
  return (
    <section className="relative z-10 bg-light-grey overflow-hidden">
      <div className="grid">
        <div className="container relative z-10">
          <div className="flex flex-col gap-2 lg:gap-4 justify-center text-center md:py-[200px] py-[90px]">
            <Reveal>
              <h2 className="gradient-sweep text-burgundy font-medium text-[28px] sm:text-[40px] lg:text-[72px] tracking-[-0.64px] lg:tracking-[-1.44px] leading-tight lg:max-w-[650px] lg:mx-auto mb-2 lg:mb-4">
                An Internet Ready for the Future
              </h2>
            </Reveal>
            <Reveal>
            <p className=" text-burgundy text-base lg:text-xl leading-7 lg:leading-8 lg:max-w-[626px] lg:mx-auto">
              Imagine a digital world with no backdoors, no gatekeepers, and no
              compromise. Q is where that vision becomes reality.
            </p>
            </Reveal>
          </div>
        </div>
      </div>
      <div className="z-[-1] absolute w-auto h-full left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2">
        <ParticlesAnimationDiv
          svgContainerId="pa--svg-plain-container"
          svgPath="/svg/home-section-hero.svg"
          svgId="home-section-hero-plain"
          particleClass="pa--particle-glow--pink"
        />
      </div>
    </section>
  );
};
