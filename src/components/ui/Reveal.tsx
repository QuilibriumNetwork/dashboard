
import { useRef, useEffect, useState, HTMLAttributes } from "react";

type AnimationType = "fadein-slide-up" | "fadein-slide-left" | "fadein-slide-right" | "fadein";

type RevealProps = {
  children: React.ReactNode;
  animation?: AnimationType;
  threshold?: number;
  delay?: number;
  duration?: number;
} & HTMLAttributes<HTMLDivElement>; // allows className, style, etc.

const Reveal = ({
  children,
  animation = "fadein-slide-up",
  threshold = 0.3,
  delay = 150,
  duration = 500,
  className = "",
  style = {},
  ...rest
}: RevealProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const animations: Record<AnimationType, string> = {
    "fadein": `opacity ${duration}ms ease-out ${delay}ms`,
    "fadein-slide-up": `transform ${duration}ms ease-out ${delay}ms, opacity ${duration}ms ease-out ${delay}ms`,
    "fadein-slide-left": `transform ${duration}ms ease-out ${delay}ms, opacity ${duration}ms ease-out ${delay}ms`,
    "fadein-slide-right": `transform ${duration}ms ease-out ${delay}ms, opacity ${duration}ms ease-out ${delay}ms`,
  };

  const transform = visible
    ? "none"
    : animation === "fadein-slide-up"
    ? "translateY(1rem)"
    : animation === "fadein-slide-left"
    ? "translateX(1rem)"
    : animation === "fadein-slide-right"
    ? "translateX(-1rem)"
    : "none";

  return (
    <div
      ref={ref}
      className={`w-full min-w-0 ${className}`}
      style={{
        opacity: visible ? 1 : 0,
        transform,
        transition: animations[animation],
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
};

export default Reveal;
