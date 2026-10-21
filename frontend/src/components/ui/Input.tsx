"use client";

import { forwardRef, InputHTMLAttributes, ReactNode, useId } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  trailing?: ReactNode;
  containerClassName?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    trailing,
    containerClassName = "",
    className = "",
    error,
    id,
    "aria-describedby": ariaDescribedBy,
    ...inputProps
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div>
      <div
        className={`flex items-center gap-2 rounded-xl border bg-white px-5 transition-all duration-200 hover:border-[#bdbdbd] focus-within:border-primary focus-within:ring-1 focus-within:ring-primary ${
          error
            ? "border-red-500 focus-within:border-red-500 focus-within:ring-red-200"
            : "border-gray-300"
        } ${containerClassName}`}
      >
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : ariaDescribedBy}
          {...inputProps}
          className={`text-secondary w-full bg-transparent py-3.5 text-sm outline-none placeholder-gray-400 ${className}`}
        />

        {trailing}
      </div>

      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 text-xs font-medium text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  );
});
