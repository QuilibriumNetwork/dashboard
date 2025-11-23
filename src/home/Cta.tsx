import { Button } from "@/components/ui/Button";
import { Link } from "react-router-dom";
import FloatingIcons from "@/components/floatingicons/FloatingIcons";
import { homeQconsoleIcons } from "@/components/floatingicons/iconSets";
import Reveal from "@/components/ui/Reveal";

export const Cta = () => {
  return (
    <section className="overflow-hidden bg-light-grey">
      <Reveal animation="fadein-slide-right">
        <div className="pt-4 pb-8 lg:pb-10">
          <div className="container-lg">
            <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-4 p-6 md:p-10 lg:py-12 lg:px-14 rounded-xl bg-light-pink">
              <div className="grid gap-6 lg:gap-8 order-2 lg:order-1">
                <div className="grid gap-4 lg:gap-6 md:max-w-[628px]">
                  <h2 className="text-[32px] lg:text-[64px] leading-[40px] lg:leading-[72px] font-medium lg:font-normal tracking-[-0.64] lg:tracking-[-1.28] text-burgundy">
                    QConsole Access
                  </h2>
                  <p className="text-base lg:text-xl leading-7 lg:leading-8 text-burgundy">
                    QConsole gives you access to <strong>QStorage</strong>, an
                    S3-compatible service, and <strong>QKMS</strong>, an
                    advanced key management system. Both run on Quilibrium’s
                    distributed architecture, delivering unmatched security and
                    performance.
                  </p>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <Button
                    asChild
                    variant="primary"
                    className="w-full md:w-auto"
                  >
                    <Link to="/qconsole">Explore QConsole</Link>
                  </Button>
                </div>
              </div>
              <FloatingIcons
                icons={homeQconsoleIcons}
                layout="landscape"
                containerClassName="max-w-[450px] w-full order-1 lg:order-2 mb-10 md:mb-10 lg:mb-0 lg:mx-20"
              />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
};
