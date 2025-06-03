import React from "react";
import { Button } from "./Button";
import LoadingSpinner from "@/app/(ui)/components/Common/LoadingSpinner";

interface LoadingButtonProps {
  /** Button label */
  label: string;
  /** Loading state */
  isLoading?: boolean;
  /** Loading message for screen readers */
  loadingMessage?: string;
  /** Button variant */
  variant?:
    | "primary"
    | "danger"
    | "white"
    | "icon"
    | "warning"
    | "outline-primary"
    | "outline-gray"
    | "outline-danger"
    | "outline-warning"
    | "more-menu-item";
  /** Button size */
  size?: "small" | "medium" | "large";
  /** Click handler */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
  /** Icon component */
  icon?: React.ReactNode;
  /** Button type */
  type?: "button" | "submit" | "reset";
  /** ARIA label for accessibility */
  ariaLabel?: string;
}

/**
 * Button component with loading state and proper ARIA labels
 */
export const LoadingButton: React.FC<LoadingButtonProps> = ({
  label,
  isLoading = false,
  loadingMessage = "Loading...",
  variant = "primary",
  size = "medium",
  onClick,
  disabled = false,
  className = "",
  icon,
  type = "button",
  ariaLabel,
}) => {
  return (
    <Button
      label={isLoading ? loadingMessage : label}
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={className}
      type={type}
      aria-label={ariaLabel || (isLoading ? loadingMessage : label)}
      aria-busy={isLoading}
      loading={isLoading}
      icon={!isLoading ? icon : undefined}
    />
  );
};
