import { NextRequest } from "next/server";

export const runtime = "edge";

async function proxy(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path } = await params;
  const pathString = path ? path.join("/") : "";
  const searchParams = request.nextUrl.searchParams.toString();
  const query = searchParams ? `?${searchParams}` : "";

  const targetUrl = `https://api.acadlabs.fun/${pathString}${query}`;

  const headers = new Headers(request.headers);
  headers.delete("host"); // Let fetch set the correct host for the destination

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? await request.arrayBuffer() : null,
      redirect: "manual",
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.set("access-control-allow-origin", "*");
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
export const PATCH = proxy;
export const OPTIONS = proxy;
export const HEAD = proxy;
