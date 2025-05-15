import { Tooltip } from "react-tooltip";
import "./Tooltip.scss";

interface SBTooltipProps {
  /**
   Id of tooltip
   */
  id: string;
  /**
   * Variant of buttons
   */
  variant?: "primary" | "white" | "danger" | "warning";
  /**
   Optional place of tooltip
   */
  place?: "top" | "bottom" | "left" | "right";
  /**
   Message to show in tooltip
   */
  message: string | undefined;
  /**
   Optional class of tooltip
   */
  className?: string;
  /**
   Optional background opacity % of tooltip
   */
  opacity?: number;
}

/**
 * Primary UI component for user interaction
 */
export const SBTooltip = ({
  id,
  variant = "primary",
  place = "bottom",
  message,
  className,
  opacity,
}: SBTooltipProps) => {
  const mode = () => {
    switch (variant) {
      case "primary":
        return "storybook-tooltip--primary";
      case "white":
        return "storybook-tooltip--white";
      case "danger":
        return "storybook-tooltip--danger";
      case "warning":
        return "storybook-tooltip--warning";
      default:
        return "";
    }
  };

  return (
    <Tooltip
      globalCloseEvents={{
        clickOutsideAnchor: true,
        scroll: true,
        escape: true,
        resize: true,
      }}
      opacity={opacity ? opacity : ""}
      anchorSelect={`#${id}`}
      openEvents={{
        click: true,
        focus: true,
        mouseenter: true,
        mousedown: true,
      }}
      place={place}
      className={["storybook-tooltip", mode(), className].join(" ")}
      content={message}
    />
  );
};
