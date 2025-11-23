import { useState } from "react";
import Reveal from "@/components/ui/Reveal";
import Modal from "@/components/ui/Modal";
import Icon from "@/components/ui/Icons";

export function Blocks() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const buildFeatures = [
    {
      title: "Built for Scale",
      icon: "/images/3d-icons/small/3d-network-green.png",
      summary:
        'Quilibrium’s "shared-nothing" architecture enables parallel processing across shards, supporting millions of messages per second — at global scale.',
      description: (
        <p>
          Quilibrium’s hypergraph structure removes traditional bottlenecks by eliminating global consensus. The system distributes computation and storage in parallel across independent shards, making massive throughput a default — not a ceiling.
        </p>
      ),
    },
    {
      title: "Privacy by Default",
      icon: "/images/3d-icons/small/3d-anon-blue.png",
      summary:
        "Quilibrium protects data from the first byte to the last. Apps can scale securely — without revealing what’s inside.",
      description: (
        <p>
          All requests in Q are resolved using Oblivious Transfer, so nodes never know what they’re handling. Computations are performed using multi-party computation, keeping the data encrypted even during execution. Communication is anonymized using mixnets to strip metadata, ensuring total privacy across the stack.
        </p>
      ),
    },
    {
      title: "Simple to Build",
      icon: "/images/3d-icons/small/3d-code-orange-square.png",
      summary:
        "Write in Go, deploy with confidence. QCL is a familiar, purpose-built language for creating private apps on Quilibrium.",
      description: (
        <p>
          Developers use QCL — a subset of Go — to build services that execute on the network. Apps behave like services: deploy, invoke, and scale. Authentication uses passkeys built into the browser, removing the need for separate wallets or seed phrases. This simplifies onboarding and enhances security by design.
        </p>
      ),
    },
  ];

  return (
    <section id="build-features" className="bg-light-grey md:pt-10">
      <div className="grid">
        <div className="container-lg relative z-10">
          <div className="flex flex-col gap-4 justify-center text-center lg:relative z-10 pt-8 pb-14 lg:pt-[100px] lg:pb-[50px]">
            <div className="absolute left-0 top-0 rounded-b-xl md:rounded-xl w-full h-[calc(100%+100px)] lg:h-[calc(100%+160px)] bg-light-pink z-[-1] overflow-hidden" />
            <Reveal>
              <h2 className="gradient-sweep text-burgundy font-medium text-[32px] lg:text-[72px] tracking-[-0.64px] lg:tracking-[-1.44px] leading-[40px] lg:leading-[92px]">
                Why Devs Choose Quilibrium
              </h2>
            </Reveal>
            <Reveal>
              <p className="text-burgundy text-base lg:text-xl leading-7 lg:leading-8 lg:max-w-[608px] mx-auto">
                Q isn’t just a new protocol — it’s a reset. Rethink what it means to deploy, run, and own the software you create.
              </p>
            </Reveal>
          </div>
        </div>
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 relative z-10 mb-6">
            {buildFeatures.map((feature, index) => (
              <Reveal key={index}>
                <button
                  onClick={() => setActiveIndex(index)}
                  className="w-full flex flex-col justify-start items-start h-full gap-6 lg:gap-[50px] px-6 sm:px-8 py-6 md:p-10 bg-white rounded-xl drop-shadow-box hover:scale-[1.016] transition-transform"
                >
                  <div className="grid gap-4 lg:gap-6">
                    <div className="flex gap-4 items-center">
                      <img
                        src={feature.icon}
                        alt={feature.title}
                        width={74}
                        height={74}
                        className="size-12 lg:size-[74px] flex-none"
                      />
                      <h3 className="pt-3 text-[24px] text-burgundy lg:text-[26px] leading-[40px] font-medium lg:font-semibold tracking-[-0.48px] lg:tracking-[-0.64px]">
                        {feature.title}
                      </h3>
                    </div>
                    <p className="text-base leading-7 lg:text-[18px] text-burgundy/90 text-left">
                      {feature.summary}
                    </p>
                  </div>
                  <p className="text-[18px] leading-6 font-semibold text-pink flex gap-3 items-center mt-auto">
                    Learn more →
                  </p>
                </button>
                <Modal
                  show={activeIndex === index}
                  onClose={() => setActiveIndex(null)}
                  title={
                    <div className="flex items-center gap-3">
                      <img src={feature.icon} alt={feature.title} className="size-10" />
                      <span>{feature.title}</span>
                    </div>
                  }
                >
                  {feature.description}
                </Modal>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
