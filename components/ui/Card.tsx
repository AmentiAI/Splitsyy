import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "bordered" | "elevated";
  padding?: "none" | "sm" | "md" | "lg";
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  variant = "default",
  padding = "md",
  hoverable = false,
  ...props
}) => {
  const baseStyles = "bg-white rounded-lg";

  const variants = {
    default: "border border-silver-300",
    bordered: "border-2 border-silver-400",
    elevated: "shadow-lg border border-silver-200",
  };

  const paddings = {
    none: "",
    sm: "p-3",
    md: "p-6",
    lg: "p-8",
  };

  const hoverStyle = hoverable
    ? "hover:shadow-md transition-shadow cursor-pointer"
    : "";

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${hoverStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <h3 className={`text-xl font-semibold text-black ${className}`} {...props}>
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<
  React.HTMLAttributes<HTMLParagraphElement>
> = ({ children, className = "", ...props }) => {
  return (
    <p className={`text-sm text-silver-600 mt-1 ${className}`} {...props}>
      {children}
    </p>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <div className={`${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <div className={`mt-4 pt-4 border-t border-silver-300 ${className}`} {...props}>
      {children}
    </div>
  );
};













