"use client";

import React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = "",
      label,
      error,
      helperText,
      fullWidth = false,
      leftIcon,
      rightIcon,
      type = "text",
      disabled,
      ...props
    },
    ref
  ) => {
    const widthClass = fullWidth ? "w-full" : "";
    const errorClass = error
      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
      : "border-gray-300 focus:ring-blue-500 focus:border-blue-500";

    return (
      <div className={widthClass}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={`
              block w-full rounded-lg border ${errorClass}
              ${leftIcon ? "pl-10" : "pl-3"}
              ${rightIcon ? "pr-10" : "pr-3"}
              py-2 text-gray-900 placeholder-gray-400
              focus:outline-none focus:ring-2
              disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
              transition-colors
              ${className}
            `}
            disabled={disabled}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";













