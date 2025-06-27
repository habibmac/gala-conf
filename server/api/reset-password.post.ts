export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);

  try {
    const response = await $fetch(`${config.public.apiUrl}/wp-json/galantis/v1/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        key: body.key,
        login: body.login,
        password: body.password,
      },
    });

    return response;
  }
  catch (error: any) {
    console.error('Reset password error:', error);

    if (error.data) {
      throw createError({
        statusCode: error.status || 400,
        statusMessage: error.data.message || 'Password reset failed',
        data: error.data,
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Password reset failed. Please try again.',
    });
  }
});
