import { fromUnixTime } from 'date-fns';
import { formatTimeAgo, formatDate } from '@/utils';

export function useEventStatus() {
  const { event } = useEvent();

  const hasEventEnded = computed(() => {
    if (!event.value?.end) return false;
    return fromUnixTime(event.value.end) < new Date();
  });

  const eventStatus = computed(() => {
    if (!event.value) return 'unknown';

    const now = new Date();
    const startDate = fromUnixTime(event.value.start);
    const endDate = fromUnixTime(event.value.end);
    const regDate = fromUnixTime(event.value.reg_begins);

    if (now < regDate) return 'registration-pending';
    if (now < startDate) return 'upcoming';
    if (now > endDate) return 'ended';
    return 'active';
  });

  // Add some useful computed properties
  const formattedDates = computed(() => ({
    start: formatDate(event.value?.start || 0, 'dd MMM yyyy HH:mm'),
    end: formatDate(event.value?.end || 0, 'dd MMM yyyy HH:mm'),
    regBegins: formatDate(event.value?.reg_begins || 0, 'dd MMM yyyy HH:mm'),
  }));

  const timeUntilStart = computed(() => {
    if (!event.value?.start) return '';
    return formatTimeAgo(fromUnixTime(event.value.start));
  });

  const timeUntilEnd = computed(() => {
    if (!event.value?.end) return '';
    return formatTimeAgo(fromUnixTime(event.value.end));
  });

  // Has seating?
  const hasSeating = computed(() => {
    return event.value?.has_seating && event.value.has_seating.length > 0;
  });

  return {
    eventStatus,
    hasEventEnded,
    formattedDates,
    timeUntilStart,
    timeUntilEnd,
    hasSeating,
  };
}
