"use client";

import React from "react";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  options: Array<{ value: string; label: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className = "",
      label,
      error,
      helperText,
      fullWidth = false,
      options,
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
        <select
          ref={ref}
          className={`
            block w-full rounded-lg border ${errorClass}
            px-3 py-2 text-gray-900
            focus:outline-none focus:ring-2
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            transition-colors
            ${className}
          `}
          disabled={disabled}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";













