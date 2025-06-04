"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type, duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
  }[type];

  return createPortal(
    <div
      className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg text-white shadow-lg transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      } ${bgColor}`}
    >
      {message}
    </div>,
    document.body
  );
}

let toastContainer: HTMLDivElement | null = null;

export function showToast(
  message: string,
  type: "success" | "error" | "info" = "info"
) {
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    document.body.appendChild(toastContainer);
  }

  const toastId = Math.random().toString(36).substr(2, 9);
  const toast = document.createElement("div");
  toast.id = toastId;
  toastContainer.appendChild(toast);

  const removeToast = () => {
    const element = document.getElementById(toastId);
    if (element) {
      element.remove();
    }
  };

  const root = document.getElementById(toastId);
  if (root) {
    const toast = <Toast message={message} type={type} onClose={removeToast} />;
    // @ts-ignore
    createPortal(toast, root);
  }
}
