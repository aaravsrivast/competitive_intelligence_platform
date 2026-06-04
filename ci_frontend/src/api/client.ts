/**
 * Mock API client. Simulates latency and returns typed mock data.
 * Replace internals with real fetch calls when backend is wired up — public
 * function signatures should remain stable.
 */

const DEFAULT_LATENCY_MS = 250;

export async function mockDelay<T>(value: T, ms: number = DEFAULT_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
