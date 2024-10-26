import { HTMLAttributes, Suspense } from "react";
import { LoadingOverlay } from "./LoadingOverlay";

function LazyRoute(props: HTMLAttributes<HTMLDivElement>) {
  return <Suspense fallback={<LoadingOverlay text="Loading" />} {...props}></Suspense>;
}

export default LazyRoute;
