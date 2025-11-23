import ArrowIcon from "@/components/ui/Arrow";
import Reveal from "@/components/ui/Reveal";

const data = [
  {
    title: "Discover",
    text: "Q is a radical rethinking of decentralized networks and “world computers.” Built on the best technologies available, it’s powerful, secure, and truly decentralized.",
    icon: "/images/3d-icons/small/3d-eye-blue.png",
    href: "https://docs.quilibrium.com/docs/discover/what-is-quilibrium",
    target: "_blank",
    rel: "noopener noreferrer",
  },
  {
    title: "Build",
    text: "Developing on Q is effortless. Deploy to our cloud-compatible services, or write applications to run natively on Q in Go.\nNeed speed and scalability? Q delivers.",
    icon: "/images/3d-icons/small/3d-code-green-circle.png",
    href: "https://docs.quilibrium.com/docs/category/applications",
    target: "_blank",
    rel: "noopener noreferrer",
  },
  {
    title: "Run",
    text: "Anyone can run a Q node, contribute to the network, and earn rewards. Q is built for continuous decentralization, ensuring that new miners can join and thrive without barriers.",
    icon: "/images/3d-icons/small/3d-cpu-orange.png",
    href: "https://docs.quilibrium.com/docs/run-node/quick-start",
    target: "_blank",
    rel: "noopener noreferrer",
  },
];

export const Blocks = () => {
  return (
    <section id="discover-build-run" className="bg-light-grey md:pt-10">
      <div className="grid">
        <div className="container-lg relative z-10">
          <div className="flex flex-col gap-4 justify-center text-center lg:relative z-10 pt-8 pb-14 lg:pt-[100px] lg:pb-[80px]">
            <div className="absolute left-0 top-0 rounded-b-xl md:rounded-xl w-full h-[calc(100%+100px)] lg:h-[calc(100%+160px)] bg-light-pink z-[-1] overflow-hidden">
              {/* <img
                src={"images/pattern.svg"}
                alt={""}
                className="w-full h-auto object-none hidden lg:block"
              /> */}
            </div>
            <Reveal>
              <h2 className="gradient-sweep text-burgundy font-medium text-[32px] lg:text-[72px] tracking-[-0.64px] lg:tracking-[-1.44px] leading-[40px] lg:leading-[92px]">
                Discover, Build, Run
              </h2>
            </Reveal>
            <Reveal>
              <p className="text-burgundy text-base lg:text-xl leading-7 lg:leading-8 lg:max-w-[608px] lg:mx-auto">
                We empower the future of the web with cutting-edge
                scalability — protecting users, ensuring true decentralization,
                and building a network that thrives for generations.
              </p>
            </Reveal>
          </div>
        </div>
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 relative z-10 mb-6">
            {data.map((item, index) => (
              <Reveal key={index}>
                <a
                  href={item.href}
                  target={item.target}
                  rel={item.rel}
                  className="flex flex-col justify-start items-start h-full gap-6 lg:gap-[50px] px-6 sm:px-8 py-6 md:p-10 bg-white rounded-xl drop-shadow-box hover:scale-[1.016] transition-transform"
                >
                  <div className="grid gap-4 lg:gap-6">
                    <div className="flex gap-4 items-center">
                      <img
                        src={item.icon}
                        alt={item.title}
                        width={74}
                        height={74}
                        className="size-12 lg:size-[74px] flex-none"
                      />
                      <h3 className="pt-3 text-[24px] text-burgundy lg:text-[32px] leading-[40px] font-medium lg:font-semibold tracking-[-0.48px] lg:tracking-[-0.64px]">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-base leading-7 lg:text-[18px] text-burgundy">
                      {item.text}
                    </p>
                  </div>
                  <p className="text-[18px] leading-6 font-semibold text-pink flex gap-3 items-center mt-auto">
                    Learn more <ArrowIcon className="h-7" />
                  </p>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
