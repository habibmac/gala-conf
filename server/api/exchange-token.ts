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
        grant_type: 'authorization_code',
        client_id: config.public.oauthClientId,
        client_secret: config.oauthClientSecret,
        code: body.code,
        redirect_uri: config.public.oauthRedirectUri,
      }),
    });
    return response;
  } catch (error) {
    console.error(error);
    throw createError({
      statusCode: 500,
      statusMessage: 'API: Failed to exchange code for tokens',
      cause: error,
    });
  }
});
