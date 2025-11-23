import { Button } from "@/components/ui/Button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/Accordion";
import { icon } from "@/assets/icons";
import Reveal from "@/components/ui/Reveal";

const faqData = [
  {
    question: "What is Quilibrium?",
    answer: (
      <p>
        Quilibrium is a decentralized network designed to run real-world
        applications with built-in privacy, verifiability, and high throughput —
        without relying on traditional blockchains.
      </p>
    ),
  },
  {
    question: "Is Quilibrium open source?",
    answer: (
      <p>
        Yes. The protocol and tools are being released progressively under the
        AGPL license. You can explore the language, documentation, and node code
        via the{" "}
        <a
          href="https://github.com/quilibriumnetwork/monorepo"
          rel="noopener noreferrer"
          target="_blank"
          className="text-link"
        >
          official GitHub
        </a>{" "}
        and docs site.
      </p>
    ),
  },
  {
    question: "How is Quilibrium different from a blockchain?",
    answer: (
      <p>
        Quilibrium replaces the linear chain model with a sharded hypergraph
        that processes data in parallel across the network. There's no global
        consensus bottleneck — each service runs independently and scales
        horizontally as new nodes join.
      </p>
    ),
  },
  {
    question: "What makes Quilibrium private?",
    answer: (
      <p>
        All computation requests use garbled circuits. Data remains encrypted
        during processing via MPC, and traffic metadata is obscured using
        mixnets. Nodes never see or store your raw data.
      </p>
    ),
  },
  {
    question: "Do I need QConsole to build on Quilibrium?",
    answer: (
      <p>
        No. QConsole is an optional dashboard provided by Quilibrium Inc. It
        gives access to services like QStorage and QKMS, but these are not
        required to build on the protocol. Builders can interact directly using
        their own services or CLI tools.
      </p>
    ),
  },
  {
    question: "How does pricing work on Quilibrium?",
    answer: (
      <p>
        Quilibrium uses a dynamic fee model — no fixed gas prices. The cost
        starts at 0.000000000125 QUIL per byte. QConsole offers a 5 GB free tier
        for storage, with usage-based billing.{" "}
        <a
          href="https://docs.quilibrium.com/docs/discover/gas-fees-and-dynamic-fee-market-on-quilibrium"
          target="_blank"
          rel="noopener noreferrer"
          className="text-link"
        >
          Learn more about gas fees.
        </a>
      </p>
    ),
  },
  {
    question: "What language do I use to build on Q?",
    answer: (
      <p>
        Apps are written in QCL — a purpose-built subset of Go designed for
        Quilibrium’s execution model. If you know Go, you’ll feel right at home.
      </p>
    ),
  },
  {
    question: "Can I just use Q for storage or messaging?",
    answer: (
      <p>
        Yes. You can use QStorage for hosting assets or tap into Quilibrium’s
        encrypted messaging system independently.
      </p>
    ),
  },
  {
    question: "What types of apps are best suited for Q?",
    answer: (
      <p>
        Apps that benefit from privacy, user data ownership, or composability —
        like social platforms, financial apps, encrypted health tools, or any
        system that needs secure, persistent services.
      </p>
    ),
  },
  {
    question: "Can I host a static site on Q?",
    answer: (
      <p>
        Absolutely. QStorage supports public buckets with domain routing and
        proxy caching — perfect for hosting static websites privately and
        efficiently.
      </p>
    ),
  },
  {
    question: "How fast is Q?",
    answer: (
      <p>
        Quilibrium has been tested to handle up to 100 million messages per
        second. Expected throughput is 1.5–2.5 million TPS. Transaction finality
        ranges from 0.2–10 seconds based on complexity and hardware.
        <br /><br />
        <em>
          Note: These figures are based on internal testing and will be
          confirmed as apps go live on Quilibrium with v2.1 and beyond.
        </em>
      </p>
    ),
  },
];

export const Faq = () => {
  return (
    <section className="pt-[44px] pb-[60px] md:py-[120px] bg-burgundy">
      <div className="container">
        <div className="grid lg:flex justify-between gap-6">
          <Reveal animation="fadein-slide-right">
            <div className="w-full md:w-[480px] flex-none">
              <div className="grid gap-4">
                <div className="grid gap-4 md:gap-6">
                  <h2 className="gradient-sweep--dark text-[32px] lg:text-[64px] leading-[40px] lg:leading-[72px] font-medium lg:font-normal tracking-[-0.64] lg:tracking-[-1.28]">
                    Your questions, answered.
                  </h2>
                  <p className="text-base leading-7 text-light-grey/80">
                    More questions? Check out:
                  </p>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <Button asChild variant="secondary">
                    <a
                      href="https://docs.quilibrium.com/docs/discover/FAQ"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <icon.linkchain className="w-5 h-5 mr-2" />
                      FAQs
                    </a>
                  </Button>

                  <Button asChild variant="secondary">
                    <a
                      href="https://docs.quilibrium.com"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <icon.linkchain className="w-5 h-5 mr-2" />
                      Documentation
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </Reveal>
          <Reveal animation="fadein-slide-left">
            <div className="w-full max-w-[737px]">
              <Accordion type="single" collapsible>
                {faqData.map((item, index) => (
                  <AccordionItem key={index} value={"item-" + index}>
                    <AccordionTrigger>{item.question}</AccordionTrigger>
                    <AccordionContent>{item.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
