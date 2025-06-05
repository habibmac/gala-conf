// server/api/login.post.ts
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);

  try {
    const response = await $fetch(`${config.public.oauthUrl}/token`, {
      body: new URLSearchParams({
        client_id: config.public.oauthClientId,
        client_secret: config.oauthClientSecret,
        grant_type: 'password',
        password: body.password,
        username: body.username,
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: 'POST',
    });
    return response;
  }
  catch (error) {
    return error;
  }
});
