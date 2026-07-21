export interface Env {
	BACKEND_URL: string;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const incoming = new URL(request.url);

		// Remove the /api prefix
		const backendPath = incoming.pathname.replace(/^\/api/, '');

		const target = new URL(backendPath + incoming.search, env.BACKEND_URL);

		const response = await fetch(target.toString(), {
			method: request.method,
			headers: request.headers,
			body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
		});

		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: response.headers,
		});
	},
};
