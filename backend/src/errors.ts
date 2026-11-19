export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "TEMPORARY_ERROR";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ApiErrorCode,
    message: string,
    public readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
  }
}

export function toErrorResponse(error: unknown, requestId?: string) {
  if (error instanceof ApiError) {
    return {
      status: error.status,
      body: {
        code: error.code,
        message: error.message,
        ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}),
        ...(requestId ? { requestId } : {}),
      },
    };
  }

  return {
    status: 503,
    body: {
      code: "TEMPORARY_ERROR" as const,
      message: "The service is temporarily unavailable",
      ...(requestId ? { requestId } : {}),
    },
  };
}
