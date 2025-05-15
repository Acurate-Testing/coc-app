import { Id, toast, ToastOptions } from 'react-toastify';

const successProps: ToastOptions = {
  className: 'custom-success-toast',
  autoClose: 3000,
};

const errorProps: ToastOptions = {
  className: 'custom-error-toast',
  autoClose: 3000,
};

const warningProps: ToastOptions = {
  className: 'custom-warning-toast',
  autoClose: 3000,
};

export const successToast = (message: string) => {
  return toast.success(message, successProps);
};

export const errorToast = (message?: string) => {
  return toast.error(
    typeof message !== 'string'
      ? 'Something went wrong'
      : message || 'Something went wrong',
    errorProps
  );
};

export const warningToast = (message: string) => {
  return toast.warning(message, warningProps);
};

export const promiseToast = async (
  promise: Promise<any>,
  loadingMessage: string,
  successMessage: string,
  errorMessage?: string
) => {
  return await toast.promise(promise, {
    pending: {
      render: loadingMessage,
      delay: 0,
      ...successProps,
    },
    success: { render: successMessage, delay: 0, ...successProps },
    error: {
      render: ({ data }: any) =>
        errorMessage ?? data?.message ?? 'Something went wrong',
      delay: 0,
      ...errorProps,
    },
  });
};

export const loadingToast = (message: string) => {
  return toast.loading(message, successProps);
};

export const loadingSuccessToast = (toastId: Id, message: string) => {
  return toast.update(toastId, {
    render: message,
    type: 'success',
    isLoading: false,
    autoClose: 5000,
    ...successProps,
  });
};

export const loadingErrorToast = (toastId: Id, message?: string) => {
  return toast.update(toastId, {
    render:
      typeof message !== 'string'
        ? 'Something went wrong'
        : message || 'Something went wrong',
    type: 'error',
    autoClose: 5000,
    isLoading: false,
    ...errorProps,
  });
};

export const closeToast = (toastId: Id) => toast.dismiss(toastId);

export const updateLoadingToast = (toastId: Id, message: string) =>
  toast.update(toastId, { render: message });
