import type { FC } from "react";
import { Composition } from "remotion";
import { ViralShort, viralShortMetadata } from "./ViralShort";
import { HEIGHT, WIDTH } from "./theme";

export const RemotionRoot: FC = () => {
  return (
    <>
      <Composition
        id={viralShortMetadata.id}
        component={ViralShort}
        durationInFrames={viralShortMetadata.durationInFrames}
        fps={viralShortMetadata.fps}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={viralShortMetadata.defaultProps}
      />
    </>
  );
};
