import React, { ButtonHTMLAttributes, ReactNode } from "react";
import "./button.scss";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Variant of buttons
   */
  variant?:
    | "primary"
    | "white"
    | "danger"
    | "warning"
    | "outline-primary"
    | "outline-gray"
    | "outline-danger"
    | "outline-warning"
    | "icon"
    | "more-menu-item";
  /**
   * What background color to use
   */
  backgroundColor?: string;
  /**
   * How large should the button be?
   */
  size?: "small" | "medium" | "large";
  /**
   * Button contents
   */
  label: string;
  /**
   * Optional click handler
   */
  onClick?: (e: any) => void;
  /**
   * Optional icon
   */
  icon?: ReactNode;
  /**
   * Optional hide
   */
  hide?: boolean;
  /**
   * Optional disabled
   */
  disabled?: boolean;
  /**
   * Optional loading state
   */
  loading?: boolean;
  /**
   * Optional aria-label for icon-only buttons
   */
  ariaLabel?: string;
  /**
   * Optional aria-describedby
   */
  ariaDescribedBy?: string;
}

/**
 * Primary UI component for user interaction
 */
export const Button = ({
  variant = "primary",
  size = "medium",
  label,
  icon,
  hide,
  disabled,
  loading,
  ariaLabel,
  ariaDescribedBy,
  className,
  ...props
}: ButtonProps) => {
  const isIconOnly = variant === "icon" && !label;
  const buttonLabel = isIconOnly ? ariaLabel || label : label;

  return (
    <button
      type="button"
      className={[
        "storybook-button",
        `storybook-button--${size}`,
        `storybook-button--${variant}`,
        hide ? "hidden" : "",
        loading ? "storybook-button--loading" : "",
        className,
      ].join(" ")}
      disabled={disabled || loading}
      aria-label={buttonLabel}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      aria-describedby={ariaDescribedBy}
      {...props}
    >
      {loading && (
        <span className="storybook-button__loading" aria-hidden="true">
          <svg
            className="animate-spin h-5 w-5"
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
        </span>
      )}
      {icon && <span className="storybook-button__icon" aria-hidden="true">{icon}</span>}
      {label && <span className="storybook-button__label">{label}</span>}
    </button>
  );
};
