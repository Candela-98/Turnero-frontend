const API_PREFIX = "/api/v1";
export const UPSTREAM_TIMEOUT_MS = 10_000;

type AllowedRoute = {
  methods: readonly string[];
  pattern: RegExp;
};

const allowedRoutes: readonly AllowedRoute[] = [
  { pattern: /^\/api\/v1\/auth\/google$/, methods: ["POST"] },
  { pattern: /^\/api\/v1\/auth\/me$/, methods: ["GET"] },
  { pattern: /^\/api\/v1\/auth\/logout$/, methods: ["POST"] },
  { pattern: /^\/api\/v1\/business$/, methods: ["GET", "PATCH"] },
  { pattern: /^\/api\/v1\/booking-settings$/, methods: ["GET", "PATCH"] },
  { pattern: /^\/api\/v1\/business-hours$/, methods: ["GET", "PUT"] },
  { pattern: /^\/api\/v1\/staff-members$/, methods: ["GET", "POST"] },
  {
    pattern: /^\/api\/v1\/staff-members\/[^/]+$/,
    methods: ["GET", "PATCH", "DELETE"],
  },
  {
    pattern: /^\/api\/v1\/staff-members\/[^/]+\/working-hours$/,
    methods: ["GET", "PUT"],
  },
  {
    pattern: /^\/api\/v1\/staff-members\/[^/]+\/service-offerings$/,
    methods: ["GET", "PUT"],
  },
  { pattern: /^\/api\/v1\/service-offerings$/, methods: ["GET", "POST"] },
  {
    pattern: /^\/api\/v1\/service-offerings\/[^/]+$/,
    methods: ["GET", "PATCH", "DELETE"],
  },
  { pattern: /^\/api\/v1\/customers$/, methods: ["GET", "POST"] },
  {
    pattern: /^\/api\/v1\/customers\/[^/]+$/,
    methods: ["GET", "PATCH", "DELETE"],
  },
  { pattern: /^\/api\/v1\/appointments$/, methods: ["GET", "POST"] },
  {
    pattern: /^\/api\/v1\/appointments\/[^/]+$/,
    methods: ["GET", "PATCH"],
  },
  {
    pattern: /^\/api\/v1\/appointments\/[^/]+\/(confirm|cancel|complete|no-show)$/,
    methods: ["POST"],
  },
  { pattern: /^\/api\/v1\/availability\/slots$/, methods: ["GET"] },
  {
    pattern: /^\/api\/v1\/public\/businesses\/[^/]+\/(booking-profile|services|availability)$/,
    methods: ["GET"],
  },
  {
    pattern: /^\/api\/v1\/public\/businesses\/[^/]+\/appointments$/,
    methods: ["POST"],
  },
  {
    pattern: /^\/api\/v1\/public\/cancellations\/[^/]+$/,
    methods: ["GET", "POST"],
  },
];

type BffErrorCode =
  | "BFF_ROUTE_NOT_FOUND"
  | "BFF_METHOD_NOT_ALLOWED"
  | "UPSTREAM_TIMEOUT"
  | "UPSTREAM_UNAVAILABLE";

function errorResponse(
  status: number,
  code: BffErrorCode,
  message: string,
  path: string,
  headers?: HeadersInit,
) {
  const error =
    status === 504
      ? "Gateway Timeout"
      : status === 502
        ? "Bad Gateway"
        : status === 405
          ? "Method Not Allowed"
          : "Not Found";

  return Response.json(
    {
      status,
      error,
      code,
      message,
      path,
      timestamp: new Date().toISOString(),
    },
    { status, headers },
  );
}

function getAllowedRoute(pathname: string) {
  return allowedRoutes.find((route) => route.pattern.test(pathname));
}

function getUpstreamUrl(pathname: string, search: string) {
  const configuredBaseUrl = process.env.TURNERO_API_BASE_URL;

  if (!configuredBaseUrl) {
    return null;
  }

  try {
    const baseUrl = new URL(configuredBaseUrl);

    if (!/^https?:$/.test(baseUrl.protocol) || baseUrl.pathname !== "/") {
      return null;
    }

    return new URL(`${pathname}${search}`, baseUrl);
  } catch {
    return null;
  }
}

function getForwardedHeaders(request: Request) {
  const headers = new Headers();

  for (const headerName of ["accept", "content-type", "cookie", "user-agent"]) {
    const value = request.headers.get(headerName);

    if (value) {
      headers.set(headerName, value);
    }
  }

  return headers;
}

function getResponseHeaders(upstreamResponse: Response) {
  const headers = new Headers();

  for (const headerName of ["content-type", "cache-control", "x-request-id"]) {
    const value = upstreamResponse.headers.get(headerName);

    if (value) {
      headers.set(headerName, value);
    }
  }

  const setCookieHeaders = (upstreamResponse.headers as Headers & {
    getSetCookie?: () => string[];
  }).getSetCookie?.() ?? [];

  for (const setCookie of setCookieHeaders) {
    headers.append("set-cookie", setCookie);
  }

  return headers;
}

export async function proxyApiRequest(request: Request, pathname: string) {
  const requestUrl = new URL(request.url);
  const route = getAllowedRoute(pathname);

  if (!route) {
    return errorResponse(404, "BFF_ROUTE_NOT_FOUND", "Ruta de API no disponible.", pathname);
  }

  if (!route.methods.includes(request.method)) {
    return errorResponse(
      405,
      "BFF_METHOD_NOT_ALLOWED",
      "Metodo HTTP no permitido.",
      pathname,
      { Allow: route.methods.join(", ") },
    );
  }

  const upstreamUrl = getUpstreamUrl(pathname, requestUrl.search);

  if (!upstreamUrl) {
    return errorResponse(
      502,
      "UPSTREAM_UNAVAILABLE",
      "El servicio no esta disponible. Intenta nuevamente.",
      pathname,
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const requestBody = ["GET", "HEAD"].includes(request.method)
      ? null
      : await request.arrayBuffer();
    const upstreamResponse = await fetch(upstreamUrl, {
      method: request.method,
      headers: getForwardedHeaders(request),
      body: !requestBody || requestBody.byteLength === 0 ? undefined : requestBody,
      cache: "no-store",
      signal: controller.signal,
    });
    const responseBody = upstreamResponse.status === 204 ? null : await upstreamResponse.arrayBuffer();

    return new Response(responseBody, {
      status: upstreamResponse.status,
      headers: getResponseHeaders(upstreamResponse),
    });
  } catch (error) {
    const isTimeout = error instanceof DOMException && error.name === "AbortError";

    return errorResponse(
      isTimeout ? 504 : 502,
      isTimeout ? "UPSTREAM_TIMEOUT" : "UPSTREAM_UNAVAILABLE",
      isTimeout
        ? "El servicio tardo demasiado en responder. Intenta nuevamente."
        : "El servicio no esta disponible. Intenta nuevamente.",
      pathname,
    );
  } finally {
    clearTimeout(timeout);
  }
}

export function toApiPath(pathSegments: string[]) {
  const pathname = `/${pathSegments.join("/")}`;

  return pathname.startsWith(API_PREFIX) ? pathname : "";
}
