export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);

  try {
    const response = await $fetch(`${config.public.apiUrl}/wp-json/galantis/v1/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        user_login: body.email,
      },
    });

    return response;
  }
  catch (error: any) {
    console.error('Forgot password error:', error);

    if (error.data) {
      throw createError({
        statusCode: error.status || 400,
        statusMessage: error.data.message || 'Password reset request failed',
        data: error.data,
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Password reset request failed. Please try again.',
    });
  }
});
