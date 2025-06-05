export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);

  try {
    const response = await $fetch(`${config.public.oauthUrl}/token`, {
      body: new URLSearchParams({
        client_id: config.public.oauthClientId,
        client_secret: config.oauthClientSecret,
        grant_type: 'refresh_token',
        refresh_token: body.refresh_token,
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: 'POST',
    });
    return response;
  }
  catch (error) {
    throw createError({
      cause: error,
      statusCode: 500,
      statusMessage: 'Failed to refresh token',
    });
  }
});
