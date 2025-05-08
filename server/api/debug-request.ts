// server/api/debug-request.ts
export default defineEventHandler(async (event) => {
    // Get all headers from the request with proper type handling
    const headers: Record<string, string | string[] | undefined> = {};

    // Get all headers with proper type checking
    for (const [key, value] of Object.entries(event.node.req.headers)) {
        // Mask sensitive headers like authorization
        if (key.toLowerCase() === 'authorization') {
            // Convert to string and safely substring
            const strValue = value?.toString() || '';
            headers[key] = strValue.substring(0, 10) + '...';
        } else {
            headers[key] = value;
        }
    }

    const config = useRuntimeConfig();

    // Return debug information
    return {
        message: 'Debug information',
        requestInfo: {
            method: event.node.req.method,
            url: event.node.req.url,
            headers: headers,
            hasAuthHeader: !!event.node.req.headers.authorization,
        },
        configInfo: {
            publicApiUrl: config.public.apiUrl,
            publicOauthUrl: config.public.oauthUrl,
            hasOauthTestToken: !!config.public.oauthAccessTokenTest,
        }
    };
});