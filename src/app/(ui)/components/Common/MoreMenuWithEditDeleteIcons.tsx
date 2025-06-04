import React, { ReactNode, useState } from "react";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import { Button } from "@/stories/Button/Button";
import { FiEdit, FiMoreVertical, FiTrash2 } from "react-icons/fi";

interface MoreMenuWithEditDeleteIconsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  placement?: "top" | "bottom" | "left" | "right";
  children?: ReactNode;
}

export const MoreMenuWithEditDeleteIcons: React.FC<
  MoreMenuWithEditDeleteIconsProps
> = ({ onEdit, onDelete, placement = "bottom", children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = `more-menu-${Math.random().toString(36).substr(2, 9)}`;

  const tooltipContent = (
    <div className="flex flex-col gap-2 p-2">
      {onEdit && (
        <Button
          className="!min-w-fit"
          variant="icon"
          label="Edit"
          icon={<FiEdit className="text-lg" />}
          onClick={onEdit}
        />
      )}
      {onDelete && (
        <Button
          className="!min-w-fit"
          variant="danger"
          label="Delete"
          icon={<FiTrash2 className="text-lg" />}
          onClick={onDelete}
        />
      )}
      {children}
    </div>
  );

  return (
    <div className="relative">
      <Button
        id={menuId}
        className="!min-w-fit"
        variant="icon"
        label=""
        icon={<FiMoreVertical className="text-lg" />}
        onClick={() => setIsOpen(!isOpen)}
      />
      <Tooltip
        anchorSelect={`#${menuId}`}
        place={placement}
        isOpen={isOpen}
        clickable
        className="storybook-tooltip storybook-tooltip--primary"
        content={tooltipContent as unknown as string}
      />
    </div>
  );
};
