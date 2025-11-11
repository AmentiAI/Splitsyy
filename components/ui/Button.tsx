"use client";

import React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary:
        "bg-gradient-to-r from-brand-green-500 via-brand-green-400 to-brand-blue-500 text-white hover:from-brand-green-400 hover:to-brand-blue-400 focus:ring-brand-blue-500 active:from-brand-green-600 active:to-brand-blue-600 shadow-lg shadow-brand-green-500/30",
      secondary:
        "bg-brand-blue-600 text-white hover:bg-brand-blue-500 focus:ring-brand-blue-400 active:bg-brand-blue-700 shadow-md shadow-brand-blue-500/40",
      outline:
        "bg-transparent border border-brand-green-400 text-brand-green-600 hover:bg-brand-green-50 hover:border-brand-green-500 focus:ring-brand-green-400 active:bg-brand-green-100",
      ghost:
        "bg-transparent text-brand-green-600 hover:bg-brand-green-50 focus:ring-brand-green-300 active:bg-brand-green-100",
      danger:
        "bg-gradient-to-r from-brand-blue-600 to-brand-blue-700 text-white hover:from-brand-blue-500 hover:to-brand-blue-600 focus:ring-brand-blue-400 active:from-brand-blue-700 active:to-brand-blue-800 shadow-md shadow-brand-blue-600/40",
    } as const;

    const sizes = {
      sm: "px-3 py-2 text-sm min-h-[36px]",
      md: "px-4 py-2.5 text-base min-h-[44px]",
      lg: "px-6 py-3 text-lg min-h-[48px]",
    };

    const widthClass = fullWidth ? "w-full" : "";

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="-ml-1 mr-2 h-4 w-4 animate-spin text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
