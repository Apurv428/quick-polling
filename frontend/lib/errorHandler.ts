// @ts-nocheck
import { toast } from 'react-hot-toast';

export const ERROR_MESSAGES = {
  VOTE_FAILED: 'Couldn\'t submit your vote',
  LIKE_FAILED: 'Couldn\'t update like',
  POLL_CREATE_FAILED: 'Couldn\'t create poll',
  FETCH_FAILED: 'Couldn\'t load polls',
  NETWORK_ERROR: 'Network connection lost',
  RATE_LIMITED: 'Too many requests. Please wait a moment',
  SERVER_ERROR: 'Server temporarily unavailable',
  UNKNOWN: 'Something went wrong',
};

export const RETRY_DELAYS = [3, 5, 10];

export class RetryableError extends Error {
  constructor(message, retryCount = 0, maxRetries = 3) {
    super(message);
    this.name = 'RetryableError';
    this.retryCount = retryCount;
    this.maxRetries = maxRetries;
    this.canRetry = retryCount < maxRetries;
  }
}

export const shouldRetry = (error) => {
  if (error.response) {
    const status = error.response.status;
   
    if (status === 429) return true;
   
    if (status >= 400 && status < 500) return false;
   
    if (status >= 500) return true;
  }
 
  if (error.message === 'Failed to fetch' || error.message === 'Network request failed') {
    return true;
  }
 
  return true;
};

export const getErrorMessage = (error) => {
  if (error.response) {
    const status = error.response.status;
    const detail = error.response.data?.detail;
   
    if (status === 400 && detail && detail.toLowerCase().includes('already voted')) {
      return 'You have already voted on this poll';
    }
   
    if (status === 429) {
      return ERROR_MESSAGES.RATE_LIMITED;
    } else if (status >= 500) {
      return ERROR_MESSAGES.SERVER_ERROR;
    } else if (status === 403 || status === 401) {
      return 'Authentication required';
    } else if (status === 404) {
      return 'Poll not found';
    } else if (status === 400 && detail) {
      return detail;
    }
  }
 
  if (error.message === 'Failed to fetch' || error.message === 'Network request failed') {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }
 
  return error.message || ERROR_MESSAGES.UNKNOWN;
};

export const retryWithDelay = async (fn, retryCount = 0, maxRetries = 3) => {
  try {
    return await fn();
  } catch (error) {
    const errorMessage = getErrorMessage(error);
   
    if (!shouldRetry(error)) {
      toast.error(errorMessage, { duration: 4000 });
      throw new RetryableError(errorMessage, maxRetries, maxRetries);
    }
   
    if (retryCount < maxRetries) {
      const delaySeconds = RETRY_DELAYS[retryCount] || 10;
     
      let countdown = delaySeconds;
      const toastId = toast.loading(
        `${errorMessage}. Retrying in ${countdown}s...`,
        { duration: Infinity }
      );
     
      const countdownInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
          toast.loading(
            `${errorMessage}. Retrying in ${countdown}s...`,
            { id: toastId }
          );
        }
      }, 1000);
     
      await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
      clearInterval(countdownInterval);
      toast.dismiss(toastId);
     
      return retryWithDelay(fn, retryCount + 1, maxRetries);
    } else {
      throw new RetryableError(errorMessage, retryCount, maxRetries);
    }
  }
};

export const showErrorToast = (message, duration = 5000) => {
  toast.error(message, { duration });
};

export const showSuccessToast = (message, duration = 3000) => {
  toast.success(message, {
    duration,
    icon: '✅',
  });
};

export const showWarningToast = (message, duration = 4000) => {
  toast(message, {
    duration,
    icon: '⚠️',
    style: {
      background: '#FEF3C7',
      color: '#92400E',
    },
  });
};