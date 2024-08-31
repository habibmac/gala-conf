export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const body = await readBody(event)
    
    try {
        console.table({
            'refresh-token': true,
            'oauthUrl': config.public.oauthUrl,
            'oauthClientId': config.public.oauthClientId,
            'oauthClientSecret': config.oauthClientSecret,
            'refresh_token': body.refresh_token,
        });
        
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