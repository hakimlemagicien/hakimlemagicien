type AppErrorReporter = {
  captureException?: (
    error: unknown,
    context?: Record<string, unknown>,
    options?: { mechanism?: { handled?: boolean } },
  ) => void;
};

declare global {
  interface Window {
    __appErrorReporter?: AppErrorReporter;
  }
}

export function reportAppError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  window.__appErrorReporter?.captureException?.(error, context, {
    mechanism: { handled: true },
  });
}
