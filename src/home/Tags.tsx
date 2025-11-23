import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useVelocity,
  useAnimationFrame,
  useMotionValue,
  wrap,
} from "framer-motion";
import { useRef } from "react";

const tags = [
  "Private",
  "Scalable",
  "Decentralized",
  "Encrypted",
  "Censorship-Resistant",
  "Verifiable",
  "Anonymous",
  "Resilient",
  "Autonomous",
  "Stateless",
  "Hypergraph",
  "Confidential",
  "Distributed",
  "Secure",
  "Fast",
];

const colorClasses = [
  "bg-light-pink text-pink",
  "bg-light-blue text-blue",
  "bg-light-orange text-orange",
  "bg-light-green text-green",
  "bg-light-purple text-purple",
];

function ParallaxRow({
  children,
  baseVelocity,
}: {
  children: React.ReactNode;
  baseVelocity: number;
}) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);

// Smooth and scale down scroll-based velocity adjustments.
// ---------------------------------------------
// `scrollVelocity` measures how fast the user is scrolling.
// `useSpring` applies damping/stiffness to avoid jittery or abrupt movements.
//   - High damping (e.g., 100) makes changes more subtle and smooth.
//   - Low stiffness (e.g., 10) slows response to sudden scroll changes.
// `useTransform` maps scroll speed to a small multiplier (here: 0 to 0.05),
//   which controls how much faster/slower the tags move when scrolling quickly.
// Reduce the max (e.g., 0.05) to make the motion feel more constant.
// Increase if you want to reintroduce more reactive scrolling effects.

  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 100,
    stiffness: 10,
  });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 0.05], {
    clamp: false,
  });

  const x = useTransform(baseX, (v) => `${wrap(-50, 0, v)}%`);
  const directionRef = useRef(1);

  useAnimationFrame((_, delta) => {
    let moveBy = directionRef.current * baseVelocity * (delta / 1000);
    if (velocityFactor.get() < 0) directionRef.current = -1;
    else if (velocityFactor.get() > 0) directionRef.current = 1;

    moveBy += directionRef.current * moveBy * velocityFactor.get();
    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div className="overflow-hidden w-full">
      <motion.ul
        className="flex gap-4 lg:gap-6 whitespace-nowrap"
        style={{ x }}
      >
        {children}
        {children}
        {children}
        {children}
      </motion.ul>
    </div>
  );
}

export const Tags = () => {
  const mid = Math.ceil(tags.length / 2);
  const groups = [tags.slice(0, mid), tags.slice(mid)];

  return (
    <section className="w-full py-10 grid gap-6 bg-burgundy">
      {groups.map((group, i) => (
        <ParallaxRow key={i} baseVelocity={i % 2 === 0 ? 2 : -2}>
          {group.map((tag, j) => {
            const style = colorClasses[j % colorClasses.length];
            return (
              <li
                key={j}
                className={`rounded-[12px] font-semibold px-4 py-3 lg:px-6 lg:py-4 text-base ${style}`}
              >
                {tag}
              </li>
            );
          })}
        </ParallaxRow>
      ))}
    </section>
  );
};
