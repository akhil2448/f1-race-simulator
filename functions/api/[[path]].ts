interface Env {
  BACKEND_URL: string;
}

interface PagesFunctionContext {
  request: Request;
  env: Env;
  params: {
    path?: string | string[];
  };
}

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
]);

export async function onRequest(
  context: PagesFunctionContext,
): Promise<Response> {
  const { request, env, params } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        Allow: 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD',
      },
    });
  }

  const apiPath = Array.isArray(params.path)
    ? params.path.join('/')
    : (params.path ?? '');

  const incomingUrl = new URL(request.url);

  const targetUrl = new URL(`${env.BACKEND_URL}/api/${apiPath}`);

  targetUrl.search = incomingUrl.search;

  const headers = new Headers();

  // Copy only safe headers
  for (const [key, value] of request.headers.entries()) {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  }

  // Preserve client information
  headers.set('X-Forwarded-Host', incomingUrl.host);
  headers.set('X-Forwarded-Proto', incomingUrl.protocol.replace(':', ''));

  try {
    const response = await fetch(targetUrl.toString(), {
      method: request.method,
      headers,
      body:
        request.method === 'GET' || request.method === 'HEAD'
          ? undefined
          : request.body,
      redirect: 'manual',
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (err) {
    console.error('Backend proxy failed:', err);

    return Response.json(
      {
        error: 'Backend unavailable',
      },
      {
        status: 502,
      },
    );
  }
}
