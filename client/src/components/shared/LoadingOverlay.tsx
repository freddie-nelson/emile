import { HTMLAttributes } from "react";

export interface LoadingOverlayProps extends HTMLAttributes<HTMLDivElement> {
  text?: string;
}

export function LoadingOverlay({ text = "Connecting...", ...props }: LoadingOverlayProps) {
  return (
    <div
      {...props}
      className={`${
        props.className ?? ""
      } absolute top-0 left-0 w-full h-full bg-black bg-opacity-30 flex justify-center items-center backdrop-blur-md`}
    >
      <h2 className="text-5xl font-bold text-white">{text}</h2>
    </div>
  );
}
