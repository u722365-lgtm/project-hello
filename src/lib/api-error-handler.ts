import { AppError } from './AppError';

// Centralized API Error Handler for Production

export interface APIError {
  status: number;
  message: string;
  code?: string;
  retryable: boolean;
}

/**
 * Thrown when the chat edge function reports the platform AI gateway is out
 * of credits AND the user has no stored BYOK key the server could auto-swap
 * to. The UI catches this and opens the BYOK key dialog so the user can add
 * their own key and continue without losing their conversation.
 */
export class CreditsExhaustedError extends AppError {
  readonly needsByok = true as const;
  constructor(message = "Platform AI credits are exhausted. Add your own API key to continue.") {
    super(message, { code: "PLATFORM_CREDITS_EXHAUSTED", statusCode: 402, isOperational: true });
    this.name = "CreditsExhaustedError";
  }
}

/** Parse a 402 chat response and return a CreditsExhaustedError when applicable. */
export async function detectCreditsExhausted(
  response: Response,
): Promise<CreditsExhaustedError | null> {
  if (response.status !== 402) return null;
  try {
    const clone = response.clone();
    const data = await clone.json();
    if (data?.needsByok === true || data?.code === "PLATFORM_CREDITS_EXHAUSTED") {
      return new CreditsExhaustedError(
        typeof data.error === "string" ? data.error : data.message,
      );
    }
  } catch {
    /* fall through */
  }
  return new CreditsExhaustedError();
}

export const API_ERROR_MESSAGES: Record<number, string> = {
  400: 'Invalid request. Please check your input and try again.',
  401: 'Your session has expired. Please sign in again.',
  402: 'AI credits exhausted. Please add more credits to continue.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Server error. Our team has been notified.',
  502: 'Service temporarily unavailable. Please try again.',
  503: 'Service is undergoing maintenance. Please try again later.',
  504: 'Request timeout. Please try again.',
};

export const parseAPIError = async (response: Response): Promise<AppError> => {
  let message = API_ERROR_MESSAGES[response.status] || 'An unexpected error occurred.';
  let code: string | undefined;

  try {
    const data = await response.json();
    if (data.error) {
      message = typeof data.error === 'string' ? data.error : data.error.message || message;
      code = data.error.code;
    }
    if (data.message) {
      message = data.message;
    }
  } catch {
    // Response body wasn't JSON, use default message
  }

  // Not strictly an 'APIError' interface anymore, but an AppError
  return new AppError(message, {
    statusCode: response.status,
    code: code || `HTTP_${response.status}`,
    isOperational: true,
  });
};

export const handleAPIError = async (
  response: Response,
  toast: (props: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void
): Promise<AppError> => {
  const error = await parseAPIError(response);

  // Handle specific error types
  switch (error.statusCode) {
    case 401:
      toast({
        title: 'Session Expired',
        description: 'Please sign in again to continue.',
        variant: 'destructive',
      });
      // Optionally redirect to login
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.href = '/auth';
        }, 2000);
      }
      break;

    case 402:
      toast({
        title: 'Credits Exhausted',
        description: 'Please add more AI credits to continue using advanced features.',
        variant: 'destructive',
      });
      break;

    case 429:
      toast({
        title: 'Rate Limited',
        description: 'You are sending requests too quickly. Please wait a moment.',
        variant: 'destructive',
      });
      break;

    default:
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
  }

  return error;
};

// Retry helper with exponential backoff
export const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  maxRetries = 3,
  baseDelay = 1000
): Promise<Response> => {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      
      // Don't retry client errors (4xx) except 429
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return response;
      }

      // Retry server errors and rate limits
      if (response.status >= 500 || response.status === 429) {
        if (i < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, i);
          console.log(`[fetchWithRetry] Retrying in ${delay}ms (attempt ${i + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Network errors are retryable
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        console.log(`[fetchWithRetry] Network error, retrying in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
};

// Helper to check if user is online
export const isOnline = (): boolean => {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
};

// Helper for graceful degradation
export const withOfflineFallback = async <T>(
  onlineHandler: () => Promise<T>,
  offlineFallback: T | (() => T)
): Promise<T> => {
  if (!isOnline()) {
    return typeof offlineFallback === 'function' 
      ? (offlineFallback as () => T)() 
      : offlineFallback;
  }

  try {
    return await onlineHandler();
  } catch (error) {
    if (!isOnline()) {
      return typeof offlineFallback === 'function' 
        ? (offlineFallback as () => T)() 
        : offlineFallback;
    }
    throw error;
  }
};
