export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const body = await readBody(event)
    console.table(
        {
            'config.public.oauthUrl': config.public.oauthUrl,
            'config.public.oauthClientId': config.public.oauthClientId,
            'config.oauthClientSecret': config.oauthClientSecret,
            'body.refresh_token': body.refresh_token,
        }
    )
    try {
        const response = await $fetch(config.public.oauthUrl + '/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: body.refresh_token,
                client_id: config.public.oauthClientId,
                client_secret: config.oauthClientSecret,
            })
        });
        return response;
    } catch (error) {
        console.error('Detailed error:', error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to refresh token',
            cause: error,
        });
    }
})