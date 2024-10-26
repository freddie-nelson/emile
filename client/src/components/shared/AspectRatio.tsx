import { useParentSize } from "@/hooks/useSize";
import { HTMLAttributes, useRef } from "react";

export interface AspectRatioProps extends HTMLAttributes<HTMLDivElement> {
  ratio: number;
  fill: "width" | "height" | "min";
}

export function AspectRatio(props: AspectRatioProps) {
  const { ratio, fill, ...rest } = props;

  const container = useRef<HTMLDivElement>(null);

  const parentRect = useParentSize(container);

  let width = parentRect?.width ?? 0;
  let height = width / ratio;

  if (fill === "min") {
    if (height > (parentRect?.height ?? 0)) {
      height = parentRect?.height ?? 0;
      width = height * ratio;
    }
  }

  return <div style={{ width: `${width}px`, height: `${height}px` }} ref={container} {...rest} />;
}
