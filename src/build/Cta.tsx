import { useState } from "react";
import { Button } from "@/components/ui/Button";
import FloatingIcons from "@/components/floatingicons/FloatingIcons";
import { qconsoleCtaIcons } from "@/components/floatingicons/iconSets";
import Reveal from "@/components/ui/Reveal";
import Modal from "@/components/ui/Modal";
import Icon from "@/components/ui/Icons";
import { Link } from "react-router-dom";

export const Cta = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <section className="overflow-hidden bg-light-grey">
      <Reveal animation="fadein-slide-left">
        <div className="pb-8 lg:pb-10">
          <div className="container-lg">
            <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-4 p-6 md:p-10 lg:py-12 lg:px-14 rounded-xl bg-light-pink">
              {/* Icons */}
              <div className="w-full max-w-[450px] mx-auto lg:w-2/5 order-1 mb-10 md:mb-16 lg:mb-0 lg:max-w-none lg:mx-0">
                <FloatingIcons
                  icons={qconsoleCtaIcons}
                  layout="landscape"
                  className="icon-set-home-qconsole"
                />
              </div>

              {/* Text */}
              <div className="w-full lg:w-3/5 order-2 grid gap-6 lg:gap-8">
                <div className="grid gap-4 lg:gap-6">
                  <h2 className="text-[32px] lg:text-[64px] leading-[40px] lg:leading-[72px] font-medium lg:font-normal tracking-[-0.64] lg:tracking-[-1.28] text-burgundy">
                    Deploy with QConsole
                  </h2>
                  <p className="text-base lg:text-xl leading-7 lg:leading-8 text-burgundy">
                    Get started fast with QConsole — the official interface for
                    launching, managing, and scaling apps on Quilibrium. Built
                    for speed, privacy, and developer clarity.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                  <Link to="/qconsole">
                    <Button variant="primary" className="w-full sm:w-auto">
                      Access QConsole
                    </Button>
                  </Link>
                  <Button
                    onClick={() => setShowModal(true)}
                    variant="outline-primary"
                    className="w-full sm:w-auto"
                  >
                    Learn more
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        title="What is QConsole?"
      >
        <ul className="ul-pink space-y-4 text-burgundy">
          <li>
            <strong>S3-Compatible Storage:</strong> Upload, host, and serve
            assets from a decentralized, encrypted backend.
          </li>
          <li>
            <strong>Key Management (QKMS):</strong> Run secure, MPC-backed
            operations without ever exposing your keys.
          </li>
          <li>
            <strong>Unified Control:</strong> Manage services, permissions, and
            usage from one clean UI.
          </li>
          <li>
            <strong>Developer Friendly:</strong> Sign in with passkeys and pay
            with crypto or fiat — no blockchain bloat or wallet gymnastics.
          </li>
        </ul>

        <p className="mt-6 text-burgundy">
          It’s the fastest way to tap into Quilibrium’s performance and privacy
          — without touching the protocol directly.
        </p>
      </Modal>
    </section>
  );
};
