import axios from 'axios';

export const getApiErrorMessage = (
  error: unknown,
  fallbackMessage: string,
): string => {
  if (axios.isAxiosError(error)) {
    const serverMessage = error.response?.data?.message;
    if (typeof serverMessage === 'string' && serverMessage.trim().length > 0) {
      return serverMessage;
    }
    if (error.response?.status === 401) {
      return 'Session expired. Please login again.';
    }
    if (error.response?.status === 403) {
      return 'You do not have permission for this module.';
    }
    if (error.response?.status === 404) {
      return 'This module endpoint is not available on backend.';
    }
    if (error.code === 'ECONNABORTED') {
      return 'Request timed out. Please try again.';
    }
    if (!error.response) {
      return 'Cannot reach server. Check backend and USB reverse.';
    }
  }
  return fallbackMessage;
};
