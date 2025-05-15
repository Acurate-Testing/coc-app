import React from "react";
import { Button, ButtonProps } from "../Button/Button";
import { ImSpinner8 } from "react-icons/im";

interface LoadingButtonProps extends ButtonProps {}
/**
 * Primary UI component for user interaction
 */
export const LoadingButton = ({ ...props }: LoadingButtonProps) => {
  return <Button icon={<ImSpinner8 className="animate-spin" />} {...props} />;
};
