import { ButtonHTMLAttributes } from "react";

export interface TextButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md" | "lg";
}

export function TextButton({ size = "md", ...props }: TextButtonProps) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <button
      {...props}
      className={`font-semibold text-blue-600 underline decoration-blue-600/60 underline-offset-4 transition-opacity hover:opacity-80 ${sizeClasses[size]} ${props.className ?? ""}`}
    />
  );
}
