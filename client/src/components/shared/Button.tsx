import { ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md" | "lg";
}

export function Button(props: ButtonProps) {
  const sizeClasses = {
    sm: "text-sm p-3",
    md: "text-base p-4",
    lg: "text-lg p-6",
  };

  return (
    <button
      {...props}
      className={`font-bold rounded-md ${sizeClasses[props.size || "md"]} bg-blue-600 text-gray-100 ${props.className ?? ""}`}
    />
  );
}
