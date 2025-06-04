"use client";

import { toast } from 'sonner';

export const showToast = (
  message: string,
  type: "success" | "error" | "info" = "info"
) => {
  switch (type) {
    case 'success':
      toast.success(message);
      break;
    case 'error':
      toast.error(message);
      break;
    case 'info':
      toast.info(message);
      break;
    default:
      toast(message);
  }
};

// Keep the old Toast component for backwards compatibility if needed
export function Toast({ message, type }: { message: string; type: string }) {
  // This is now just a wrapper around showToast
  showToast(message, type as "success" | "error" | "info");
  return null;
}
