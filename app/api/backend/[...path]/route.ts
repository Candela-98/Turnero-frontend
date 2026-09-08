import { proxyApiRequest, toApiPath } from "@/lib/api/bff";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function handleRequest(request: Request, context: RouteContext) {
  const { path } = await context.params;

  return proxyApiRequest(request, toApiPath(path));
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PATCH = handleRequest;
export const PUT = handleRequest;
export const DELETE = handleRequest;
