import ParticlesAnimationDiv from "@/components/ui/ParticleAnimationsDiv";
import Reveal from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Icon from "@/components/ui/Icons";
import { useState } from "react";

export const HeroAnimation = () => {
  const [showModal, setShowModal] = useState(false);

  const renderBullets = (items: { title: string; desc: string }[]) => (
    <ul className="pl-1 space-y-3 text-burgundy">
      {items.map((item, idx) => (
        <li key={idx} className="flex gap-3 items-start">
          <Icon name="check" className="w-5 h-5 mt-1 text-pink shrink-0" />
          <span>
            <strong>{item.title}:</strong> {item.desc}
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <section className="relative z-0 bg-light-grey overflow-hidden">
        <div className="grid">
          <div className="container relative z-10">
            <div className="flex flex-col gap-4 justify-center text-center md:py-[200px] py-[90px]">
              <Reveal>
                <h2 className="gradient-sweep text-burgundy font-medium text-[28px] sm:text-[40px] lg:text-[72px] tracking-[-0.64px] lg:tracking-[-1.44px] leading-tight lg:max-w-[700px] lg:mx-auto -mb-2 sm:mb-2 lg:mb-4">
                  What Can You Build?
                </h2>
              </Reveal>
              <Reveal>
                <p className="text-burgundy text-base sm:hidden leading-7 max-w-[300px] mx-auto mb-4">
                  Build private, composable apps — from tools to full platforms.
                </p>
                <p className="text-burgundy text-base hidden sm:block lg:text-xl leading-7 lg:leading-8 lg:max-w-[626px] lg:mx-auto mb-8">
                  From personal tools to full-scale platforms, Quilibrium is
                  built to support any application that benefits from privacy,
                  verifiability, or composability.
                </p>
                <div className="block sm:hidden">
                  <Button
                    variant="primary"
                    size="small"
                    onClick={() => setShowModal(true)}
                  >
                    See Examples
                  </Button>
                </div>
                <div className="hidden sm:block">
                  <Button variant="primary" onClick={() => setShowModal(true)}>
                    See Examples
                  </Button>
                </div>
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

      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        title={<span>What Kinds of Apps Run on Q?</span>}
      >
        <div className="space-y-4">
          <p>
            Quilibrium supports a wide range of use cases — especially those
            where privacy, ownership, or user-driven logic matter.
          </p>
          <p>
            <strong>Popular categories include:</strong>
          </p>
          {renderBullets([
            {
              title: "Social Media",
              desc: "Image sharing, long-form content, social graphs — all hosted privately, with user-controlled data.",
            },
            {
              title: "Finance & Assets",
              desc: "DeFi logic, tokenized assets, private payments, or confidential market-making.",
            },
            {
              title: "Everyday Web",
              desc: "SPAs, APIs, file hosting, encrypted backups, decentralized content networks.",
            },
          ])}
          <p>
            <strong>Ask yourself:</strong> What would be better if it were
            private, tokenizable, or composable?
          </p>
          {renderBullets([
            {
              title:
                "Health data, personal conversations, and shopping activity",
              desc: "All safer and more useful when protected by default.",
            },
            {
              title:
                "Digital collectibles, streaming content, or user-generated media",
              desc: "Now programmable and interoperable.",
            },
          ])}
          <p>
            <strong>And beyond that?</strong>
          </p>
          {renderBullets([
            {
              title: "Imagine a social post that trains an ML model",
              desc: "And pays the user every time their data is used.",
            },
            {
              title:
                "Or a health study where users contribute encrypted records",
              desc: "Get matched without revealing private info, and are compensated automatically.",
            },
          ])}
          <p>
            Quilibrium is built for that next wave — where apps aren't just
            functional, they're fair, private, and composable by design.
          </p>
        </div>
      </Modal>
    </>
  );
};
