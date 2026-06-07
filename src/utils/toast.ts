import { toast, ToastOptions } from 'react-toastify';

// Custom toast options that match the project theme
const defaultOptions: ToastOptions = {
  position: 'top-right',
  autoClose: 4000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

// Track recently shown toasts to prevent duplicates within 500ms
const recentToasts = new Map<string, number>();
const DEDUP_TIMEOUT = 500; // milliseconds

const isDuplicate = (message: string): boolean => {
  const lastShown = recentToasts.get(message);
  if (lastShown && Date.now() - lastShown < DEDUP_TIMEOUT) {
    return true;
  }
  return false;
};

const recordToast = (message: string): void => {
  recentToasts.set(message, Date.now());
};

// Success toast with primary blue theme
export const showSuccessToast = (message: string, options?: ToastOptions) => {
  if (isDuplicate(message)) return;
  recordToast(message);
  return toast.success(message, {
    ...defaultOptions,
    ...options,
    className: 'toast-success',
  });
};

// Error toast with red theme
export const showErrorToast = (message: string, options?: ToastOptions) => {
  if (isDuplicate(message)) return;
  recordToast(message);
  return toast.error(message, {
    ...defaultOptions,
    ...options,
    className: 'toast-error',
  });
};

// Warning toast with orange theme
export const showWarningToast = (message: string, options?: ToastOptions) => {
  if (isDuplicate(message)) return;
  recordToast(message);
  return toast.warning(message, {
    ...defaultOptions,
    ...options,
    className: 'toast-warning',
  });
};

// Info toast with blue theme
export const showInfoToast = (message: string, options?: ToastOptions) => {
  if (isDuplicate(message)) return;
  recordToast(message);
  return toast.info(message, {
    ...defaultOptions,
    ...options,
    className: 'toast-info',
  });
};

// Generic toast
export const showToast = (message: string, options?: ToastOptions) => {
  return toast(message, {
    ...defaultOptions,
    ...options,
  });
};

// Export toast for advanced usage
export { toast };
