import { showToast } from "@/app/components/Toast";

export const successToast = (message: string) => {
  showToast(message, "success");
};

export const errorToast = (message: string) => {
  showToast(message, "error");
};

export const infoToast = (message: string) => {
  showToast(message, "info");
};
