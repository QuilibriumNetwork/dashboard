import { Button } from "@/components/ui/Button";
import { icon } from "@/assets/icons";
import Reveal from "@/components/ui/Reveal";

export const Community = () => {
  return (
    <section className="py-10 lg:py-24 overflow-hidden bg-burgundy">
      <div className="container">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6 text-center lg:text-left">
          <Reveal animation="fadein-slide-right">
            <div className="grid gap-6 lg:gap-8">
              <div className="grid gap-4 lg:gap-6 md:max-w-[517px]">
                <h2 className=" gradient-sweep--dark text-[32px] lg:text-[64px] leading-[40px] lg:leading-[72px] font-medium lg:font-normal tracking-[-0.64] lg:tracking-[-1.28]">
                  The Privacy Community
                </h2>
                <p className="text-base leading-7 text-light-grey">
                  Join Quorum, our decentralized group messenger built for true
                  freedom of speech. Encrypted, scalable, and
                  censorship-resistant — Quorum is a living demo of Q in action.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start text-center sm:text-left gap-6 text-white">
                <div className="flex-shrink-0">
                  <Button asChild variant="secondary">
                    <a
                      href="https://www.quorummessenger.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Quorum Messenger"
                      className="flex items-center"
                    >
                      <icon.linkchain className="w-5 h-5 mr-2" />
                      WEBSITE
                    </a>
                  </Button>
                </div>

                {/* Deactivate when apps are ready */}
                <div className="flex-shrink-0 font-medium text-light-grey">
                  Coming soon to:
                </div>

                {/* Deactivate when apps are ready */}
                <div className="flex flex-col items-start gap-1 text-light-grey text">
                  <div className="flex items-center gap-2">
                    <icon.googleplay className="w-4 h-4" />
                    Google Play
                  </div>
                  <div className="flex items-center gap-2">
                    <icon.appstore className="w-4 h-4" />
                    App Store
                  </div>
                </div>

                {/* Activate when apps are ready */}
                <Button asChild variant="secondary" className="hidden">
                  <a
                    href="https://play.google.com/store/apps/details?id=your.app.id"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <icon.googleplay className="w-5 h-5" />
                    Google play
                  </a>
                </Button>

                <Button asChild variant="secondary" className="hidden">
                  <a
                    href="https://apps.apple.com/app/idYourAppID"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <icon.appstore className="w-5 h-5" />
                    App store
                  </a>
                </Button>
              </div>
            </div>
          </Reveal>
          <Reveal animation="fadein-slide-left">
            <div className="relative max-w-[628px] after:block after:absolute after:bottom-0 after:left-0 after:w-full after:h-[64px] after:bg-gradient-to-t after:from-[color:var(--burgundy)] after:to-transparent after:z-10 after:pointer-events-none">
              <img
                src="images/quorum.png"
                alt="quorum"
                width={628}
                height={461}
                className="w-full h-auto"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
