import { Button } from "@/components/ui/Button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/Accordion";
import { icon } from "@/assets/icons";
import Reveal from "@/components/ui/Reveal";
import { JSX } from "react";

interface FAQItem {
  question: string;
  answer: JSX.Element;
}

const data: FAQItem[] = [
  {
    question: "Can Q handle traffic for an app with millions of users?",
    answer: (
      <>
        <p>
          <strong>Quilibrium’s shared-nothing architecture</strong>, similar to
          ScyllaDB, allows parallel transaction processing without resource
          conflicts — unlike Ethereum’s single-threaded model.
        </p>
        <p>
          This makes it scalable by design. Quilibrium could support{" "}
          <strong>100 million</strong> or even{" "}
          <strong>2 billion daily active users</strong>, assuming transactions
          don’t conflict and the network scales properly.
        </p>
      </>
    ),
  },
  {
    question: "How fast is Q?",
    answer: (
      <>
        <p>
          Quilibrium was designed to support ultra-scale applications like
          social networks and messaging apps fully on-chain.
        </p>
        <p>
          The network has been tested to handle{" "}
          <strong>up to 100 million messages per second (MPS)</strong>. While
          MPS ≠ TPS, they are closely related.
        </p>
        <br />
        <p>
          <strong>• Estimated upper bound:</strong>1.5–2.5 million TPS
          <br />
          <strong>• Transaction finality:</strong> 0.2–10 seconds
        </p>
        <br />
        <p>
          <em>
            Note: Performance will be confirmed starting with version 2.1.
          </em>
        </p>
      </>
    ),
  },
  {
    question: "How does Q prevent centralization?",
    answer: (
      <>
        <p>
          Quilibrium ensures decentralization by allowing consensus without
          demanding expensive hardware — even a <strong>Raspberry Pi</strong>{" "}
          can run a node.
        </p>
        <p>
          It also accepts diverse hardware for mining. The protocol enforces{" "}
          <strong>minimum replication thresholds</strong>, and halts core
          operations if these drop too low.
        </p>
        <p>
          <strong>Tokenomics</strong> are designed to welcome new miners as the
          network grows.
        </p>
      </>
    ),
  },
  {
    question: "What types of applications can be built on Quilibrium?",
    answer: (
      <>
        <p>
          Any type of application can be hosted on Quilibrium. In the early
          stages, we expect:
        </p>
        <br />
        <p>
          <strong>• Social Media</strong>, such as image hosting and social
          graphs
          <br />
          <strong>• Financial applications</strong>, like tokenized assets and
          DeFi
          <br />
          <strong>• Modern Web Apps</strong>, including SPAs and file hosting
        </p>
      </>
    ),
  },
  {
    question:
      "Can Q protect users in restrictive environments from government surveillance?",
    answer: (
      <>
        <p>
          Quilibrium allows nodes to run permissionlessly, anywhere — and offers
          better identity protection than Tor in many cases.
        </p>
        <p>
          Tor can be undermined in countries like the US or Germany, where
          governments run many nodes. But in regions like{" "}
          <strong>Brazil</strong> or <strong>Chile</strong>, Q offers better
          anonymity.
        </p>
        <br />
        <p>
          ⚠️ Still, <strong>{`complete safety isn't guaranteed`}</strong>.
          Browser fingerprinting via JavaScript remains a risk.
        </p>
      </>
    ),
  },
  {
    question: "What is Quilibrium Inc. ?",
    answer: (
      <>
        <p>
          <strong>Quilibrium Inc.</strong> is a US-based company offering
          managed services like:
        </p>
        <br />
        <p>
          • Quorum Messenger
          <br />
          • Q Storage (S3-compatible)
          <br />• Key Management Service (KMS)
        </p>
        <br />
        <p>
          It is <strong>separate</strong> from the open Quilibrium protocol —
          anyone can build services on top of the protocol.
        </p>
      </>
    ),
  },
  {
    question:
      "How do QStorage's costs compare to AWS S3 or other cloud providers?",
    answer: (
      <>
        <p>
          QStorage is designed to be <strong>highly cost-effective</strong>{" "}
          compared to AWS S3 and similar providers.
        </p>
        <p>
          It offers a familiar <strong>5 GB free tier</strong>, but with{" "}
          <strong>no egress fees</strong> for public buckets, and significantly
          reduced costs for <strong>Key Management (KMS)</strong> and secure
          file storage.
        </p>
        <p>
          Thanks to built-in caching and a query-based model, QStorage is ideal
          even for high-traffic apps — and can outperform{" "}
          <strong>Cloudflare R2</strong> in many use cases.
        </p>
      </>
    ),
  },
  {
    question:
      "What are the options and pricing for hosting a website on QStorage?",
    answer: (
      <>
        <p>
          You get <strong>5 GB free</strong> for hosting a minimal static site.
        </p>
        <br />
        <p>
          Larger sites pay via tiered pricing.
          <br />
          No hidden fees — <strong>encryption</strong>,{" "}
          <strong>replication</strong>, and <strong>backups</strong> are all
          included by default.
        </p>
      </>
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
            <div className="max-w-[737px] w-full">
              <Accordion type="single" collapsible>
                {data.map((item, index) => (
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
