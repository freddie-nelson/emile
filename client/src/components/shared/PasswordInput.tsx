import { InputHTMLAttributes } from "react";

export interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  showPassword: boolean;
  onToggleShowPassword: () => void;
}

export function PasswordInput({ label, showPassword, onToggleShowPassword, ...props }: PasswordInputProps) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-bold text-gray-700">{label}</span>
      <input
        className="rounded-md border border-gray-300 bg-white px-4 py-3 text-lg text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-300"
        type={showPassword ? "text" : "password"}
        {...props}
      />
      <button
        type="button"
        className="self-end text-sm font-semibold text-blue-700 underline decoration-blue-700/60 underline-offset-4 transition-opacity hover:opacity-80"
        onClick={onToggleShowPassword}
      >
        {showPassword ? "hide password" : "show password"}
      </button>
    </label>
  );
}
