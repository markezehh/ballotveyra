export class ApiError extends Error {
  constructor(status, code, message, fieldErrors) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export function toErrorResponse(error, requestId) {
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
      code: "TEMPORARY_ERROR",
      message: "The service is temporarily unavailable",
      ...(requestId ? { requestId } : {}),
    },
  };
}
