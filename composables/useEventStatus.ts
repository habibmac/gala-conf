export function useEventStatus() {
  const { event } = useEvent();

  const hasEventEnded = computed(() => {
    if (!event.value?.end_date)
      return false;
    return new Date(event.value.end_date) < new Date();
  });

  const eventStatus = computed(() => {
    if (!event.value)
      return 'unknown';

    const now = new Date();
    const startDate = new Date(event.value.date_start);
    const endDate = new Date(event.value.end_date);
    const regDate = new Date(event.value.reg_begins);

    if (now < regDate)
      return 'registration-pending';
    if (now < startDate)
      return 'upcoming';
    if (now > endDate)
      return 'ended';
    return 'active';
  });

  const timeUntilStart = computed(() => {
    if (!event.value?.date_start)
      return '';
    return formatTimeAgo(event.value.date_start);
  });

  const timeUntilEnd = computed(() => {
    if (!event.value?.date_end)
      return '';
    return formatTimeAgo(event.value.date_end);
  });

  const hasSeating = computed(() => {
    return event.value?.has_seating;
  });

  return {
    eventStatus,
    hasEventEnded,
    hasSeating,
    timeUntilEnd,
    timeUntilStart,
  };
}
