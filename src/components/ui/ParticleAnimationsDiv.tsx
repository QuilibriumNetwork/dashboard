
import React, {useEffect} from "react";
import {initParticleAnimation} from "@/components/helpers/particleAnimation";
import {cn} from "@/components/helpers";

interface ParticlesAnimationDivProps {
    svgContainerId: string;
    svgPath: string;
    svgId: string;
    fluidSvg?: boolean;
    particleClass?: string;
    className?: string;
}

const ParticlesAnimationDiv: React.FC<ParticlesAnimationDivProps> = ({
                                                                         className,
                                                                         svgContainerId,
                                                                         svgPath,
                                                                         svgId,
                                                                         particleClass = "pa--particle-glow--pink",
                                                                     }) => {
    useEffect(() => {
        initParticleAnimation({
            containerId: svgContainerId,
            svgPath,
            svgId,
            particleClass,
        });
    }, [svgContainerId, svgPath, svgId, particleClass]);

    return (
        <div
            className={cn('justify-center items-center h-full w-full [&_svg]:h-full [&_svg]:w-auto [&_svg]:flex-none', className)}
            id={svgContainerId}
        />
    );
};

export default ParticlesAnimationDiv;
