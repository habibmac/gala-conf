export const transformFiltersForAPI = (filters: Record<string, any>) => {
  const transformed = { ...filters };

  // Array parameters that should be converted to comma-separated strings
  const arrayParams = ['status', 'ticket_ids', 'question_ids', 'ticket_name'];

  arrayParams.forEach((param) => {
    if (transformed[param] && Array.isArray(transformed[param])) {
      transformed[param] = transformed[param].join(',');
    }
  });

  return transformed;
};
