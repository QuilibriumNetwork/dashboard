
import { gsap } from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

gsap.registerPlugin(MotionPathPlugin);

export interface ParticleAnimationOptions {
  containerId: string;
  svgPath: string;
  svgId: string;
  pathPrefix?: string;
  glowLayerId?: string;
  particleClass?: string;
}
export function initParticleAnimation({
  containerId,
  svgPath,
  svgId,
  pathPrefix = "path_",
  glowLayerId = "pa--particles-layer",
  particleClass = "pa--particle-glow--pink",
}: ParticleAnimationOptions): void {
  fetch(svgPath)
    .then((res) => res.text())
    .then((svgText) => {
      const container = document.getElementById(containerId);
      if (!container) return;

      container.innerHTML = svgText;
      const svg = container.querySelector("svg") as SVGSVGElement;
      if (!svg) return;
      svg.setAttribute("id", svgId);

      initGlowDots({ svgId, pathPrefix, glowLayerId, particleClass });
    })
    .catch((err) => {
      console.error(`Error loading ${svgPath}:`, err);
    });
}

function initGlowDots({
  svgId,
  pathPrefix,
  glowLayerId,
  particleClass,
}: {
  svgId: string;
  pathPrefix: string;
  glowLayerId: string;
  particleClass: string;
}) {
  const svg = document.getElementById(svgId);
  if (!(svg instanceof SVGSVGElement)) return;
  if (!svg) return;

  const paths = svg.querySelectorAll("path[id^='path-']");
  const glowLayer = svg.querySelector(`#${glowLayerId}`);
  if (!glowLayer) return;

  const computedStyle = getComputedStyle(document.documentElement);
  let radius = 4;

  if (particleClass.includes("pink")) {
    radius =
      parseFloat(computedStyle.getPropertyValue("--pa-radius-pink")) || 4;
  } else if (particleClass.includes("white")) {
    radius =
      parseFloat(computedStyle.getPropertyValue("--pa-radius-white")) || 4;
  } else {
    radius =
      parseFloat(computedStyle.getPropertyValue("--pa-particle-radius")) || 4;
  }

  paths.forEach((path, index) => {
    const dot = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    dot.setAttribute("r", radius.toString());
    dot.setAttribute("class", `pa--particle-glow ${particleClass}`);
    dot.setAttribute("id", `glowDot_${pathPrefix}_${index}`);
    dot.setAttribute("opacity", "0");
    glowLayer.appendChild(dot);

    gsap.to(dot, {
      duration: 4 + Math.random() * 1.5,
      repeat: -1,
      ease: "none",
      motionPath: {
        path: path as SVGPathElement,
        align: path as SVGPathElement,
        alignOrigin: [0.5, 0.5],
        autoRotate: false,
      },
      onUpdate: function () {
        const progress = this.progress();
        let opacity = 1;

        const fadeStart = 0.75;
        const fadeEnd = 0.95;

        if (progress < 0.15) {
          opacity = progress / 0.15;
        } else if (progress > fadeStart) {
          opacity = Math.max(
            0,
            1 - (progress - fadeStart) / (fadeEnd - fadeStart)
          );
        }

        dot.setAttribute("opacity", opacity.toString());
      },
    });
  });
}
