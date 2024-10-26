import { HTMLAttributes } from "react";

export interface ButtonProps extends HTMLAttributes<HTMLButtonElement> {}

export function Button(props: ButtonProps) {
  return (
    <button
      {...props}
      className={`font-bold rounded-md p-4 bg-blue-600 text-white ${props.className ?? ""}`}
    />
  );
}
