import type { ApiError, ApiErrorResult } from '@/types/api-error';

export function handleApiError(
  error: unknown,
  defaultMessage: string = 'An error occurred',
): ApiErrorResult {
  let errorMessage = defaultMessage;
  let errorDescription = 'Please try again';

  if (isApiError(error)) {
    const apiError = error.response?.data;

    // Use the API's message directly - your backend already provides good messages
    if (apiError?.message) {
      errorMessage = apiError.message;
      errorDescription = ''; // Don't show redundant description
    }

    // Handle multiple errors
    if (apiError?.errors && Array.isArray(apiError.errors)) {
      errorDescription = apiError.errors.join('; ');
      errorMessage = 'Multiple errors occurred';
    }
  }
  else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return { errorMessage, errorDescription };
}

// Type guard function
function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object'
    && error !== null
    && 'response' in error
    && typeof (error as any).response === 'object'
    && 'data' in (error as any).response
  );
}
