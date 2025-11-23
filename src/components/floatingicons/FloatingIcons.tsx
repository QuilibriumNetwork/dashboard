import React from "react";
import { cn } from "@/components/helpers/classnames";

export type IconData = {
  srcWebp: string;
  srcPng: string;
  alt: string;
  className: string;
  style: React.CSSProperties;
  flip?: boolean;
};

type FloatingIconsGroupProps = {
  icons: IconData[];
  layout?: "square" | "landscape" | "single";
  className?: string;
  containerClassName?: string;
  style?: React.CSSProperties;
  id?: string;
  loading?: "lazy" | "eager";
};

// Define animations inline
const breatheKeyframes = `
  @keyframes breathe-a {
    0%, 100% { transform: translate(0em, 0em) rotate(0deg); }
    50% { transform: translate(0.25em, -0.15em) rotate(-0.2deg); }
  }
  @keyframes breathe-b {
    0%, 100% { transform: translate(0em, 0em) rotate(0deg); }
    50% { transform: translate(-0.2em, 0.15em) rotate(0.15deg); }
  }
  @keyframes breathe-c {
    0%, 100% { transform: translate(0em, 0em) rotate(0deg); }
    50% { transform: translate(0.2em, 0.2em) rotate(-0.1deg); }
  }
`;

const animationClass = (index: number): React.CSSProperties => {
  const animations = ["breathe-a", "breathe-b", "breathe-c", "breathe-a"];
  return {
    animation: `${animations[index % 4]} ${6.5 + index * 0.2}s ease-in-out infinite`,
  };
};

export default function FloatingIcons({
  icons,
  layout = "square",
  containerClassName = "",
  style = {},
  id,
  loading = "lazy",
}: FloatingIconsGroupProps) {
  const layoutClass =
    layout === "square"
      ? "aspect-square"
      : layout === "landscape"
      ? "aspect-[16/9]"
      : "aspect-square";

  return (
    <>
      {/* Inject keyframes once */}
      <style>{breatheKeyframes}</style>

      <div
        id={id}
        className={cn(
          "relative flex items-center justify-center pointer-events-auto",
          layoutClass,
          containerClassName
        )}
        style={{
          perspective: "1000px",
          filter:
            "drop-shadow(0.5em 0.5em 0.25em rgba(0, 0, 0, 0.15)) drop-shadow(2em 1em 1em rgba(0, 0, 0, 0.15))",
          ...style,
        }}
      >
        {icons.map(({ srcWebp, srcPng, alt, className: iconClass, style, flip }, index) => (
          <div
            key={index}
            className={cn("absolute", iconClass)}
            style={{ ...style, ...animationClass(index) }}
          >
            <div
              className={cn("inline-block", flip && "scale-x-[-1]")}
              style={{ willChange: "transform" }}
            >
              <picture>
                <source srcSet={srcWebp} type="image/webp" />
                <img
                  src={srcPng}
                  alt={alt}
                  loading={loading}
                  className="w-full transition-all duration-200 ease-in-out hover:brightness-110"
                  style={{
                    filter:
                      "drop-shadow(0.5em 0.5em 0.25em rgba(0, 0, 0, 0.15)) drop-shadow(2em 1em 1em rgba(0, 0, 0, 0.15))",
                    transition: "filter 0.35s ease-in-out, transform 0.2s ease",
                  }}
                />
              </picture>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
