// server/api/login.post.ts
export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const body = await readBody(event);

    try {
        const response = await $fetch(config.public.oauthUrl + '/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'password',
                client_id: config.public.oauthClientId,
                client_secret: config.oauthClientSecret,
                username: body.username,
                password: body.password,
            }),
        });
        return response;
    } catch (error) {
        console.error('Login error:', error);
        throw createError({
            statusCode: 500,
            statusMessage: 'API: Failed to authenticate user',
            cause: error,
        });
    }
});