export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);

  try {
    const response = await $fetch(`${config.public.apiUrl}/wp-json/galantis/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email,
        user_role: body.user_role || 'ee_event_organizer',
        phone: body.phone || '',
        organization: body.organization || '',
      },
    });

    return response;
  }
  catch (error: any) {
    // ✅ Centralized error handling
    console.error('Registration error:', error);

    // Transform WordPress errors to consistent format
    if (error.data) {
      throw createError({
        statusCode: error.status || 400,
        statusMessage: error.data.message || 'Registration failed',
        data: error.data,
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Registration failed. Please try again.',
    });
  }
});
