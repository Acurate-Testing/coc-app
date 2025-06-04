import React from "react";

interface ChipProps {
  value: string;
  className?: string;
  variant?: "filled" | "outlined";
  color?: "blue" | "green" | "red" | "yellow" | "purple" | "gray";
}

const colorClasses = {
  blue: "bg-blue-100 text-blue-800",
  green: "bg-green-100 text-green-800",
  red: "bg-red-100 text-red-800",
  yellow: "bg-yellow-100 text-yellow-800",
  purple: "bg-purple-100 text-purple-800",
  gray: "bg-gray-100 text-gray-800",
};

const outlinedColorClasses = {
  blue: "border border-blue-500 text-blue-800",
  green: "border border-green-500 text-green-800",
  red: "border border-red-500 text-red-800",
  yellow: "border border-yellow-500 text-yellow-800",
  purple: "border border-purple-500 text-purple-800",
  gray: "border border-gray-500 text-gray-800",
};

export const Chip: React.FC<ChipProps> = ({
  value,
  className = "",
  variant = "filled",
  color = "gray",
}) => {
  const baseClasses =
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium";
  const colorClass =
    variant === "filled" ? colorClasses[color] : outlinedColorClasses[color];

  return (
    <span className={`${baseClasses} ${colorClass} ${className}`}>{value}</span>
  );
};
