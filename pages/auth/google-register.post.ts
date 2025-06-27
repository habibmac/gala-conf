export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);

  try {
    const response = await $fetch(`${config.public.apiUrl}/wp-json/galantis/v1/auth/google/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        google_token: body.google_token,
        user_data: body.user_data,
      },
    });

    return response;
  }
  catch (error: any) {
    console.error('Google registration error:', error);

    if (error.data) {
      throw createError({
        statusCode: error.status || 400,
        statusMessage: error.data.message || 'Google registration failed',
        data: error.data,
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Google registration failed. Please try again.',
    });
  }
});
