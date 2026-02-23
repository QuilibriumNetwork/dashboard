import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import BackgroundVideo from "@/components/BackgroundVideo";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import Modal from "@/components/ui/Modal";
import Icon from "@/components/ui/Icons";

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

  const [showCommunityModal, setShowCommunityModal] = useState(false);

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
                Join the Builders at the Edge of Web3
              </h2>
            </Reveal>
            <Reveal>
              <p className="text-light-grey text-base lg:text-xl leading-7 lg:leading-8 lg:max-w-[550px] lg:mx-auto">
                From indie developers to global teams, Quilibrium gives you the
                freedom to build without compromise — no platform dependencies,
                no central control.
              </p>
            </Reveal>
          </div>
          <div className="flex justify-center">
            <Reveal>
              <div className="flex justify-center">
                <div className="flex flex-row flex-wrap justify-center gap-3">
                  <Button asChild variant="beige" className="mb-2 sm:mb-0">
                    <a
                      href="https://docs.quilibrium.com"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Icon
                        name="informationcircle"
                        className="w-5 h-auto mr-2"
                      />
                      Docs
                    </a>
                  </Button>
                  <Button
                    variant="outline-beige"
                    onClick={() => setShowCommunityModal(true)}
                  >
                    <Icon name="happyface" className="w-5 h-auto mr-2" />
                    Community
                  </Button>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      <div className="z-[-1] absolute w-full h-full left-0 top-0">
        <BackgroundVideo
          src="videos/network-loop.mp4"
          overlay="bg-pink/20"
          fallback="/images/network-loop-fallback.jpg"
        />
      </div>

      <Modal
        show={showCommunityModal}
        onClose={() => setShowCommunityModal(false)}
        title="Join the Community"
      >
        <ul className="ul-pink space-y-4 text-burgundy">
          <li>
            <a
              href="https://discourse.quilibrium.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-link"
            >
              Discourse Forum
            </a>
          </li>
          {/* <li>
            <a
              href="https://quorummessenger.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-link"
            >
              Quorum Messenger
            </a>
          </li> */}
        </ul>
      </Modal>
    </section>
  );
};
