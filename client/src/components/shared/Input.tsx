import { InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Input({ label, ...props }: InputProps) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-bold text-gray-700">{label}</span>
      <input
        className="rounded-md border border-gray-300 bg-white px-4 py-3 text-lg text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-300"
        {...props}
      />
    </label>
  );
}
