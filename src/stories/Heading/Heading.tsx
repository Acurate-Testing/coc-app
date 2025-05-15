import React from "react";

import "./Heading.scss";

interface HeadingProps {
  /**
   Type of heading (Responsive)
   */
  type?:
    | "heading1"
    | "heading2"
    | "heading3"
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "h5"
    | "h6";
  /**
   * Label contents
   */
  label: string;
  /**
   * Label title
   */
  title?: string;
  /**
   * Optional heading color
   */
  color?: string;
  /**
   * Optional click handler
   */
  onClick?: () => void;
}

/**
 * Primary UI component for user interaction
 */
export const Heading = ({
  label,
  title,
  type = "h1",
  color,
  onClick,
}: HeadingProps) => {
  return (
    <span
      className={["storybook-heading", `storybook-heading--${type}`].join(" ")}
      style={{ color }}
      onClick={onClick}
      title={title}
    >
      {label}
    </span>
  );
};
