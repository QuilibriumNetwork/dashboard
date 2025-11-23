import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import BackgroundVideo from "@/components/BackgroundVideo";

import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";

export const HeroVideo = () => {
  const scrollRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start end", "end start"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const scaledProgress = useTransform(smoothProgress, [0, 1], [1, 1.3]);
  const scaledProgressY = useTransform(smoothProgress, [0, 1], [1, 50]);

  return (
    <section
      ref={scrollRef}
      className="bg-burgundy relative z-10 overflow-hidden lg:py-[200px] py-[90px] after:block after:w-full after:top-0 after:h-full after:absolute after:bg-black/50 after:z-[-1]"
    >
      <div className="container">
        <div className="grid gap-6 lg:gap-8">
          <div className="gap gap-4 justify-center text-center relative">
            <Reveal>
              <h2 className="gradient-sweep--dark text-burgundy font-medium text-[32px] lg:text-[72px] tracking-[-0.64px] lg:tracking-[-1.44px] leading-[40px] lg:leading-[92px] lg:max-w-[800px] lg:mx-auto">
                Powered by People all Around the World
              </h2>
            </Reveal>
            <Reveal>
              <p className="text-light-grey text-base lg:text-xl leading-7 lg:leading-8 lg:max-w-[550px] lg:mx-auto">
                Thousands of nodes to support the mission of a decentralized
                internet.
              </p>
            </Reveal>
          </div>
          <div className="flex justify-center">
            <Reveal>
              <div className="flex justify-center">
                <Button
                  asChild
                  variant="outline-beige"
                  className="w-full md:w-auto"
                >
                  <a
                    href="https://dashboard.quilibrium.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Check the live stats
                  </a>
                </Button>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
      <div className="z-[-1] absolute w-full h-full left-0 top-0">
        <BackgroundVideo
          src="videos/earth-loop-2.mp4"
          overlay="bg-pink/20"
          fallback="/images/earth-loop-fallback.jpg"
        />
      </div>
    </section>
  );
};
