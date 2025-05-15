import React, { ReactNode } from "react";

import "./Label.scss";

interface LabelProps {
  /**
   Size of label (Responsive)
   */
  size?: "large" | "medium" | "small" | "extra-small";
  /**
   * Label id
   */
  id?: string;
  /**
   * Label for
   */
  for?: string;
  /**
   * Label contents
   */
  label: string | ReactNode;
  /**
   * Label title
   */
  title?: string;
  /**
   * Optional label color
   */
  color?: string;
  /**
   * Optional label class
   */
  className?: string;
  /**
   * Optional click handler
   */
  onClick?: () => void;
  /**
   * Optional htmlFor
   */
  htmlFor?: string;
  /**
   * Optional required to show required icon
   */
  requiredLabel?: boolean;
}

/**
 * Primary UI component for user interaction
 */
export const Label = ({
  id,
  for: labelFor,
  label,
  title,
  size = "medium",
  color,
  className,
  onClick,
  htmlFor,
  requiredLabel,
}: LabelProps) => {
  return (
    <label
      id={id}
      htmlFor={labelFor}
      className={[
        "storybook-label",
        `storybook-label--${size}`,
        className,
      ].join(" ")}
      title={title}
      style={{ color }}
      onClick={onClick}
      {...(htmlFor && { htmlFor })}
    >
      {label}
      {label !== "" && requiredLabel && (
        <span className="text-colorDanger">*</span>
      )}
    </label>
  );
};
