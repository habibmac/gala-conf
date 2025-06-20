import { format, formatDistanceToNow, fromUnixTime, parseISO } from 'date-fns';
import { format as formatTz, toZonedTime } from 'date-fns-tz';
import { id } from 'date-fns/locale/id';

export const formatValue = (value: number) =>
  Intl.NumberFormat('id-ID', {
    currency: 'IDR',
    maximumSignificantDigits: 3,
    notation: 'compact',
    style: 'currency',
  }).format(value);

export const formatCurrency = (value: number) =>
  Intl.NumberFormat('id-ID', {
    currency: 'IDR',
    maximumFractionDigits: 0,
    notation: 'standard',
    style: 'currency',
  }).format(value);

export const formatThousands = (value: number) =>
  Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
    style: 'decimal',
  }).format(value);

type DateFormatInput = number | string | Date;
type FormatOption = 'unix' | 'iso' | 'date';

export const formatDate = (
  value: DateFormatInput,
  dateFormat: string = 'dd MMM yyyy',
  inputFormat: FormatOption = 'iso',
  errorReturnValue: string = '-',
): string => {
  try {
    let date: Date;

    switch (inputFormat) {
      case 'unix':
        date = fromUnixTime(value as number);
        break;
      case 'iso':
        date = new Date(value as string); // ISO strings parse correctly
        break;
      case 'date':
        date = value as Date;
        break;
      default:
        date = new Date(value as string);
    }

    return format(date, dateFormat, { locale: id });
  }
  catch (error) {
    console.error('Error formatting date', error);
    return errorReturnValue;
  }
};

// ✅ Fixed timezone formatter
export const formatDateInTz = (
  dateString: string,
  formatStr: string = 'dd MMM yyyy HH:mm',
  timezone: string = 'Asia/Jakarta',
): string => {
  try {
    const utcDate = new Date(dateString); // ISO string is already UTC
    const zonedDate = toZonedTime(utcDate, timezone);

    return formatTz(zonedDate, formatStr, {
      timeZone: timezone,
      locale: id,
    });
  }
  catch (error) {
    console.error('Error formatting date with timezone', error);
    return '-';
  }
};

export const formatThousandsToK = (number: number) => {
  if (number < 1000) {
    return number.toString();
  }
  else if (number < 10000) {
    return `${(number / 1000).toFixed(1)}k+`;
  }
  else {
    return `${Math.floor(number / 1000)}k+`;
  }
};

export const formatTimeAgo = (date: Date): string => {
  return formatDistanceToNow(date, { addSuffix: true });
};

export const getTimezoneAbbreviation = (isoDate: string | undefined): string => {
  // ✅ Add safety check
  if (!isoDate)
    return 'UTC';

  const timezoneMap: Record<string, string> = {
    '+07:00': 'WIB',
    '+08:00': 'WITA',
    '+09:00': 'WIT',
    '+00:00': 'UTC',
    '-05:00': 'EST',
    '-03:00': 'BRT',
  };

  const match = isoDate.match(/([+-]\d{2}:\d{2})$/);
  const offset = match ? match[1] : '+00:00';
  return timezoneMap[offset] || offset;
};

export const formatDateWithTzName = (
  isoDate: string | undefined,
  format: string = 'd MMM yyyy HH:mm',
): string => {
  if (!isoDate)
    return '-';

  try {
    const formatted = formatDate(isoDate, format, 'iso');
    const tzAbbr = getTimezoneAbbreviation(isoDate);
    return `${formatted} ${tzAbbr}`;
  }
  catch (error) {
    console.error('Error formatting date with timezone:', error);
    return '-';
  }
};

export const formatDateRange = (
  startDate: string | undefined,
  endDate: string | undefined,
  format: string = 'd MMMM yyyy HH:mm',
): string => {
  if (!startDate || !endDate)
    return '-';

  try {
    const startFormatted = formatDate(startDate, format, 'iso');
    const endFormatted = formatDate(endDate, format, 'iso');
    const tzAbbr = getTimezoneAbbreviation(startDate);

    // Check if same date
    const startDay = formatDate(startDate, 'd MMMM yyyy', 'iso');
    const endDay = formatDate(endDate, 'd MMMM yyyy', 'iso');

    if (startDay === endDay) {
      // Same day: "1 Sep 2025 06:00-15:00 WIB"
      const startTime = formatDate(startDate, 'HH:mm', 'iso');
      const endTime = formatDate(endDate, 'HH:mm', 'iso');
      return `${startDay} ${startTime}–${endTime} ${tzAbbr}`;
    }
    else {
      // Different days: "1 Sep 2025 06:00 WIB - 1 Sep 2026 15:00 WIB"
      return `${startFormatted} ${tzAbbr} - ${endFormatted} ${tzAbbr}`;
    }
  }
  catch (error) {
    console.error('Error formatting date range:', error);
    return '-';
  }
};

// Helper functions for date conversion
export const formatDateForPicker = (dateValue: string | Date | null) => {
  if (!dateValue)
    return null;

  try {
    if (typeof dateValue === 'string') {
      // If it's ISO string, parse it
      if (dateValue.includes('T') || dateValue.includes('+')) {
        return parseISO(dateValue);
      }
      // If it's datetime-local format, convert to Date
      return new Date(dateValue);
    }
    return dateValue;
  }
  catch (error) {
    console.warn('Error parsing date:', error);
    return null;
  }
};

export const formatDateForSubmission = (dateValue: Date | string | null) => {
  if (!dateValue)
    return '';

  try {
    if (dateValue instanceof Date) {
      // Convert to ISO string format that your backend expects
      return dateValue.toISOString();
    }
    return dateValue;
  }
  catch (error) {
    console.warn('Error formatting date for submission:', error);
    return '';
  }
};
