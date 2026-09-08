const BFF_BASE_PATH = "/api/backend";

export type ApiErrorBody = {
  code?: string;
  details?: unknown;
  error?: string;
  message?: string;
  status?: number;
};

export class ApiError extends Error {
  readonly code: string | undefined;
  readonly details: unknown;

  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.code = isApiErrorBody(body) ? body.code : undefined;
    this.details = isApiErrorBody(body) ? body.details : undefined;
  }
}

export type ApiRequestOptions = {
  body?: unknown;
  headers?: HeadersInit;
  method?: "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
};

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === "object" && value !== null;
}

function buildApiUrl(endpoint: string) {
  if (!endpoint.startsWith("/api/v1/")) {
    throw new Error("API endpoints must start with /api/v1/.");
  }

  const parsedEndpoint = new URL(endpoint, "https://turnero.invalid");

  if (parsedEndpoint.origin !== "https://turnero.invalid" || parsedEndpoint.hash) {
    throw new Error("API endpoints must be same-origin relative paths.");
  }

  return `${BFF_BASE_PATH}${parsedEndpoint.pathname}${parsedEndpoint.search}`;
}

async function readResponseBody(response: Response) {
  if (response.status === 204) {
    return undefined;
  }

  const text = await response.text();

  if (!text) {
    return undefined;
  }

  if (response.headers.get("content-type")?.includes("application/json")) {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }

  return text;
}

export async function apiFetch<TResponse>(
  endpoint: string,
  { body, headers, method = "GET" }: ApiRequestOptions = {},
): Promise<TResponse> {
  const response = await fetch(buildApiUrl(endpoint), {
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: "include",
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    method,
  });
  const responseBody = await readResponseBody(response);

  if (!response.ok) {
    const message = isApiErrorBody(responseBody) && responseBody.message
      ? responseBody.message
      : `Request failed with status ${response.status}.`;

    throw new ApiError(message, response.status, responseBody);
  }

  return responseBody as TResponse;
}
