import { HTMLAttributes, useEffect, useState } from "react";

export interface LoadingOverlayProps extends HTMLAttributes<HTMLDivElement> {
  text?: string;
  addDynamicEllipsis?: boolean;
  dynamicEllipsisInterval?: number;
}

export function LoadingOverlay({
  text = "Loading",
  addDynamicEllipsis = true,
  dynamicEllipsisInterval = 300,
  ...props
}: LoadingOverlayProps) {
  const [t, setT] = useState(text);

  useEffect(() => {
    setT(text + (addDynamicEllipsis ? "..." : ""));
    if (!addDynamicEllipsis) return;

    const interval = setInterval(() => {
      setT((prev) => {
        if (!prev) return prev;

        const dots = prev.match(/\./g) || [];
        const count = dots.length;

        if (count === 3) return prev.replace(/\.{3}$/, "");
        return prev + ".";
      });
    }, dynamicEllipsisInterval);

    return () => clearInterval(interval);
  }, [text, addDynamicEllipsis, dynamicEllipsisInterval]);

  return (
    <div
      {...props}
      className={`${
        props.className ?? ""
      } absolute top-0 left-0 w-full h-full bg-black bg-opacity-30 flex justify-center items-center backdrop-blur-md`}
    >
      <h2 className="text-5xl font-bold text-white">{t}</h2>
    </div>
  );
}
