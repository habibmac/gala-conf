import { useRequestEvent, useRequestHeaders } from "nuxt/app";

// server/api/me.ts
export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const authHeader = event.headers.get('Authorization');

    // include cookies in the request
    const headers = event?.node.req?.headers.cookie;

    if (!authHeader) {
        throw createError({
            statusCode: 401,
            message: 'No authorization header',
        });
    }

    try {
        const response = await $fetch(config.public.oauthUrl + '/me', {
            headers: {
                credentials: 'include',
                Authorization: authHeader,
                ...(headers && { cookie: headers }),
            },
        });
        return response;
    } catch (error: any) {
        console.error('Error fetching user profile:', error);
        console.log('error.response', error.response);
        console.log('authHeader', authHeader);
        throw createError({
            statusCode: error.response?.status || 500,
            statusMessage: error.response?.statusText || 'Internal Server Error',
            message: error.message,
        });
    }
});