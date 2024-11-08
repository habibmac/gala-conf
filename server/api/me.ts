// server/api/me.ts
export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();

    // include cookies in the request
    const authHeader = event.headers.get('Authorization');

    if (!authHeader) {
        throw createError({
            statusCode: 401,
            message: 'No authorization header',
        });
    }

    console.log('config', config);

    try {
        const response = await $fetch(config.public.oauthUrl + '/me', {
            headers: {
                Authorization: authHeader,
            },
            credentials: 'include',
        });
        return response;
    } catch (error: any) {
        console.log('Request URL:', config.public.oauthUrl + '/me');
        console.error('Full error:', error);
        console.error('Error response data:', error.response?._data);
        console.log('authHeader', authHeader);
        throw createError({
            statusCode: error.response?.status || 500,
            statusMessage: error.response?.statusText || 'Internal Server Error',
            message: error.message,
        });
    }
});