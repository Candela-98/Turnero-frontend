const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type ApiRequestOptions = {
  body?: unknown;
  headers?: HeadersInit;
  method?: "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
};

function buildApiUrl(endpoint: string) {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured.");
  }

  const normalizedBaseUrl = API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;

  return new URL(normalizedEndpoint, normalizedBaseUrl).toString();
}

async function readResponseBody(response: Response) {
  if (response.status === 204) {
    return undefined;
  }

  const contentType = response.headers.get("content-type");
  const text = await response.text();

  if (!text) {
    return undefined;
  }

  if (contentType?.includes("application/json")) {
    return JSON.parse(text);
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
    throw new ApiError(
      `Request failed with status ${response.status}.`,
      response.status,
      response.statusText,
      responseBody,
    );
  }

  return responseBody as TResponse;
}
