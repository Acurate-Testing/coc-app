import { toast, ToastOptions } from 'react-toastify';

const defaultProps: ToastOptions = {
  autoClose: 4000,
  position: "top-right",
};

export const successToast = (message: string) => {
  toast.success(message, defaultProps);
};

export const errorToast = (message: string) => {
  toast.error(message, defaultProps);
}; 