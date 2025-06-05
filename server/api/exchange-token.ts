export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);

  try {
    const response = await $fetch(`${config.public.oauthUrl}/token`, {
      body: new URLSearchParams({
        client_id: config.public.oauthClientId,
        client_secret: config.oauthClientSecret,
        code: body.code,
        grant_type: 'authorization_code',
        redirect_uri: config.public.oauthRedirectUri,
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: 'POST',
    });
    return response;
  }
  catch (error) {
    console.error(error);
    throw createError({
      cause: error,
      statusCode: 500,
      statusMessage: 'API: Failed to exchange code for tokens',
    });
  }
});
