import { addHours, format, formatDistanceToNow, fromUnixTime } from 'date-fns';
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

type DateFormatInput = number | Date;
type FormatOption = 'unix' | 'date';

export const formatDate = (
  value: DateFormatInput,
  dateFormat: string = 'dd MMM yyyy',
  inputFormat: FormatOption = 'unix',
  errorReturnValue: string = '-',
): string => {
  try {
    const date = inputFormat === 'unix' ? fromUnixTime(value as number) : (value as Date);
    return format(date, dateFormat, { locale: id });
  }
  catch (error) {
    console.error('Error formatting date', error);
    return errorReturnValue;
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

export const formatToUTC7 = (dateString: string) => {
  const utcDate = new Date(dateString);
  const utc7Date = addHours(utcDate, 7);
  return format(utc7Date, 'dd MMM yyyy HH:mm');
};
