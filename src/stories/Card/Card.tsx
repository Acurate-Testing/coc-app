import React, { ReactNode } from "react";

import "./Card.scss";

interface CardProps {
  /**
   * Optional card classes
   */
  className?: string;
  /**
   * Card content
   */
  children: ReactNode;
  /**
   * Card onClick
   */
  onClick?: any;
}

/**
 * Primary UI component for user interaction
 */
export const Card = ({ className, children, onClick }: CardProps) => {
  return (
    <div
      className={[
        "storybook-card w-full border border-colorLighter rounded-normal bg-white",
        className,
      ].join(" ")}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
