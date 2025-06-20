export const TIMEZONES = {
  JAKARTA: 'Asia/Jakarta',
  MAKASSAR: 'Asia/Makassar',
  JAYAPURA: 'Asia/Jayapura',
  UTC: 'UTC',
} as const;

export const TIMEZONE_OPTIONS = [
  { label: 'Asia/Jakarta (WIB)', value: TIMEZONES.JAKARTA },
  { label: 'Asia/Makassar (WITA)', value: TIMEZONES.MAKASSAR },
  { label: 'Asia/Jayapura (WIT)', value: TIMEZONES.JAYAPURA },
  { label: 'UTC', value: TIMEZONES.UTC },
];

export const DEFAULT_TIMEZONE = TIMEZONES.JAKARTA;
