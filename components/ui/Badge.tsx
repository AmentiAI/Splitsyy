import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md" | "lg";
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className = "",
  variant = "default",
  size = "md",
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-full";

  const variants = {
    default: "bg-silver-200 text-black",
    success: "bg-silver-300 text-black",
    warning: "bg-silver-400 text-black",
    danger: "bg-black text-white",
    info: "bg-silver-500 text-white",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-0.5 text-sm",
    lg: "px-3 py-1 text-base",
  };

  return (
    <span
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};













