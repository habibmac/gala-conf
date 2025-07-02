// server/api/me.ts
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const authHeader = event.headers.get('Authorization');

  if (!authHeader) {
    throw createError({
      message: 'Authentication required',
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  try {
    const response = await $fetch(`${config.public.oauthUrl}/me/`, {
      credentials: 'include',
      headers: {
        Authorization: authHeader,
      },
    });
    return response;
  }
  catch (error) {
    return error;
  }
});
