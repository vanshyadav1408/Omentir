import { Composition } from "remotion";
import { ProductVideo, VIDEO } from "./ProductVideo";
import "./styles.css";
import "./mock.css";

export const Root = () => {
  return (
    <Composition
      id="ProductVideo"
      component={ProductVideo}
      durationInFrames={VIDEO.durationInFrames}
      fps={VIDEO.fps}
      width={VIDEO.width}
      height={VIDEO.height}
    />
  );
};
