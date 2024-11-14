// server/api/me.ts
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const authHeader = event.headers.get('Authorization');

  if (!authHeader) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  try {
    const response = await $fetch(config.public.oauthUrl + '/me', {
      headers: {
        Authorization: authHeader,
      },
      credentials: 'include',
    });
    return response;
  } catch (error) {
    return error;
  }
});
