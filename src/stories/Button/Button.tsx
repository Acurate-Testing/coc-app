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
   * Optional disbled
   */
  disabled?: boolean;
}

/**
 * Primary UI component for user interaction
 */
export const Button = ({
  variant = "primary",
  size = "medium",
  backgroundColor,
  label,
  icon,
  hide,
  className,
  disabled,
  ...props
}: ButtonProps) => {
  const mode = () => {
    switch (variant) {
      case "primary":
        return "storybook-button--primary";
      case "white":
        return "storybook-button--white";
      case "danger":
        return "storybook-button--danger";
      case "warning":
        return "storybook-button--warning";
      case "outline-primary":
        return "storybook-button--outline-primary";
      case "outline-gray":
        return "storybook-button--outline-gray";
      case "outline-danger":
        return "storybook-button--outline-danger";
      case "outline-warning":
        return "storybook-button--outline-warning";
      case "icon":
        return "storybook-button--icon-button";
      case "more-menu-item":
        return "storybook-button--more-menu-item";
      default:
        return "";
    }
  };

  return (
    <button
      type="button"
      className={[
        `storybook-button bg-red-600 gap-2 outline-none overflow-hidden whitespace-nowrap ${
          hide ? "!hidden" : ""
        } ${disabled ? "!opacity-50 !pointer-events-none" : ""}`,
        `storybook-button--${size}`,
        mode(),
        className,
      ].join(" ")}
      style={{ backgroundColor }}
      {...props}
    >
      {icon}
      {label}
    </button>
  );
};
