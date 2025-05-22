import React from "react";
import { IoMdClose } from "react-icons/io";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

const Modal: React.FC<ModalProps> = ({
  open,
  title,
  onClose,
  children,
  size = "md",
}) => {
  if (!open) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-full",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none bg-black bg-opacity-50">
      <div
        className={`relative w-full ${sizeClasses[size]} mx-auto my-6 bg-white rounded-lg shadow-lg`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="flex items-center justify-center p-1 ml-auto text-gray-500 transition-colors duration-200 rounded hover:text-gray-700 hover:bg-gray-100"
          >
            <IoMdClose size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="relative flex-auto">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
