import React from "react";

export interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  label?: string;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "danger";
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercentage = false,
  size = "md",
  variant = "default",
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  const heights = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  const variants = {
    default: "bg-blue-600",
    success: "bg-green-600",
    warning: "bg-yellow-600",
    danger: "bg-red-600",
  };

  // Auto-adjust variant based on percentage
  let autoVariant = variant;
  if (variant === "default") {
    if (percentage >= 100) autoVariant = "success";
    else if (percentage >= 75) autoVariant = "warning";
  }

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          {showPercentage && (
            <span className="text-sm text-gray-600">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className={`${variants[autoVariant]} ${heights[size]} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};













