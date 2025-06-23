interface StatusConfig {
  id: string
  label: string
  icon: string
  // Hardcoded Tailwind classes for each variant
  textClass: string
  badgeClass: string
  pillClass: string
  dotClass: string
  // Shadcn badge variant fallback
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline'
}

export const allRegStatuses: StatusConfig[] = [
  {
    id: 'RAP',
    label: 'Approved',
    icon: 'heroicons:check-circle',
    textClass: 'text-emerald-600 dark:text-emerald-300',
    badgeClass: 'border-emerald-500 text-emerald-700 bg-emerald-50 dark:border-emerald-400 dark:text-emerald-300 dark:bg-emerald-950/20',
    pillClass: 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-white',
    dotClass: 'bg-emerald-500 ring-2 ring-emerald-500/20 border border-emerald-500/20 ring-offset-2',
    badgeVariant: 'outline',
  },
  {
    id: 'RPP',
    label: 'Pending Payment',
    icon: 'heroicons:clock',
    textClass: 'text-sky-600 dark:text-sky-300',
    badgeClass: 'border-sky-500 text-sky-700 bg-sky-50 dark:border-sky-400 dark:text-sky-300 dark:bg-sky-950/20',
    pillClass: 'bg-sky-600 text-white dark:bg-sky-500 dark:text-white',
    dotClass: 'bg-sky-500',
    badgeVariant: 'secondary',
  },
  {
    id: 'RCN',
    label: 'Cancelled',
    icon: 'heroicons:x-circle',
    textClass: 'text-red-600 dark:text-red-300',
    badgeClass: 'border-red-500 text-red-700 bg-red-50 dark:border-red-400 dark:text-red-300 dark:bg-red-950/20',
    pillClass: 'bg-red-600 text-white dark:bg-red-500 dark:text-white',
    dotClass: 'bg-red-500',
    badgeVariant: 'destructive',
  },
  {
    id: 'RAB',
    label: 'Abandoned',
    icon: 'heroicons:archive-box-x-mark',
    textClass: 'text-gray-600 dark:text-gray-300',
    badgeClass: 'border-gray-500 text-gray-700 bg-gray-50 dark:border-gray-400 dark:text-gray-300 dark:bg-gray-950/20',
    pillClass: 'bg-gray-600 text-white dark:bg-gray-500 dark:text-white',
    dotClass: 'bg-gray-500',
    badgeVariant: 'outline',
  },
  {
    id: 'RIC',
    label: 'Incomplete',
    icon: 'heroicons:exclamation-triangle',
    textClass: 'text-slate-800 dark:text-slate-300',
    badgeClass: 'border-slate-500 text-slate-700 bg-slate-50 dark:border-slate-400 dark:text-slate-300 dark:bg-slate-950/20',
    pillClass: 'bg-slate-600 text-white dark:bg-slate-500 dark:text-white',
    dotClass: 'bg-slate-500',
    badgeVariant: 'outline',
  },
];

export const allTransStatuses: StatusConfig[] = [
  {
    id: 'TCM',
    label: 'Completed',
    icon: 'heroicons:check-circle',
    textClass: 'text-emerald-800 dark:text-emerald-300',
    badgeClass: 'border-emerald-500 text-emerald-700 bg-emerald-50 dark:border-emerald-400 dark:text-emerald-300 dark:bg-emerald-950/20',
    pillClass: 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-white',
    dotClass: 'bg-emerald-500',
    badgeVariant: 'default',
  },
  {
    id: 'TIN',
    label: 'Incomplete',
    icon: 'heroicons:clock',
    textClass: 'text-blue-800 dark:text-blue-300',
    badgeClass: 'border-blue-500 text-blue-700 bg-blue-50 dark:border-blue-400 dark:text-blue-300 dark:bg-blue-950/20',
    pillClass: 'bg-blue-600 text-white dark:bg-blue-500 dark:text-white',
    dotClass: 'bg-blue-500',
    badgeVariant: 'secondary',
  },
  {
    id: 'TAB',
    label: 'Abandoned',
    icon: 'heroicons:archive-box-x-mark',
    textClass: 'text-gray-800 dark:text-gray-300',
    badgeClass: 'border-gray-500 text-gray-700 bg-gray-50 dark:border-gray-400 dark:text-gray-300 dark:bg-gray-950/20',
    pillClass: 'bg-gray-600 text-white dark:bg-gray-500 dark:text-white',
    dotClass: 'bg-gray-500',
    badgeVariant: 'outline',
  },
  {
    id: 'TOP',
    label: 'Overpaid',
    icon: 'heroicons:exclamation-triangle',
    textClass: 'text-yellow-800 dark:text-yellow-300',
    badgeClass: 'border-yellow-500 text-yellow-700 bg-yellow-50 dark:border-yellow-400 dark:text-yellow-300 dark:bg-yellow-950/20',
    pillClass: 'bg-yellow-500 text-white dark:bg-yellow-500 dark:text-white',
    dotClass: 'bg-yellow-500',
    badgeVariant: 'outline',
  },
];

export const allTicketStatuses: StatusConfig[] = [
  {
    id: 'TKS',
    label: 'Sold Out',
    icon: 'heroicons:no-symbol',
    textClass: 'text-purple-800 dark:text-purple-300',
    badgeClass: 'border-purple-500 text-purple-700 bg-purple-50 dark:border-purple-400 dark:text-purple-300 dark:bg-purple-950/20',
    pillClass: 'bg-purple-600 text-white dark:bg-purple-500 dark:text-white',
    dotClass: 'bg-purple-500',
    badgeVariant: 'secondary',
  },
  {
    id: 'TKE',
    label: 'Expired',
    icon: 'heroicons:clock',
    textClass: 'text-gray-800 dark:text-gray-300',
    badgeClass: 'border-gray-500 text-gray-700 bg-gray-50 dark:border-gray-400 dark:text-gray-300 dark:bg-gray-950/20',
    pillClass: 'bg-gray-600 text-white dark:bg-gray-500 dark:text-white',
    dotClass: 'bg-gray-500',
    badgeVariant: 'outline',
  },
  {
    id: 'TKA',
    label: 'Archived',
    icon: 'heroicons:archive-box',
    textClass: 'text-slate-800 dark:text-slate-300',
    badgeClass: 'border-slate-500 text-slate-700 bg-slate-50 dark:border-slate-400 dark:text-slate-300 dark:bg-slate-950/20',
    pillClass: 'bg-slate-600 text-white dark:bg-slate-500 dark:text-white',
    dotClass: 'bg-slate-500',
    badgeVariant: 'outline',
  },
  {
    id: 'TKP',
    label: 'Pending',
    icon: 'heroicons:clock',
    textClass: 'text-sky-800 dark:text-sky-300',
    badgeClass: 'border-sky-500 text-sky-700 bg-sky-50 dark:border-sky-400 dark:text-sky-300 dark:bg-sky-950/20',
    pillClass: 'bg-sky-600 text-white dark:bg-sky-500 dark:text-white',
    dotClass: 'bg-sky-500',
    badgeVariant: 'secondary',
  },
  {
    id: 'TKO',
    label: 'On Sale',
    icon: 'heroicons:shopping-cart',
    textClass: 'text-emerald-800 dark:text-emerald-300',
    badgeClass: 'border-emerald-500 text-emerald-700 bg-emerald-50 dark:border-emerald-400 dark:text-emerald-300 dark:bg-emerald-950/20',
    pillClass: 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-white',
    dotClass: 'bg-emerald-500',
    badgeVariant: 'default',
  },
];

// Combine all statuses
const allStatuses: StatusConfig[] = [...allRegStatuses, ...allTransStatuses, ...allTicketStatuses];

// Default/unknown status
const defaultStatus: StatusConfig = {
  id: 'UNKNOWN',
  label: 'Unknown',
  icon: 'heroicons:question-mark-circle',
  textClass: 'text-gray-800 dark:text-gray-300',
  badgeClass: 'border-gray-300 text-gray-700 bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:bg-gray-950/20',
  pillClass: 'bg-gray-600 text-white dark:bg-gray-500 dark:text-white',
  dotClass: 'bg-gray-500',
  badgeVariant: 'outline',
};

// Status map
export const statusMap: Record<string, StatusConfig> = allStatuses.reduce(
  (acc, status) => {
    acc[status.id] = status;
    return acc;
  },
  { UNKNOWN: defaultStatus } as Record<string, StatusConfig>,
);

// Helper functions
export const getStatusInfo = (statusId: string): StatusConfig => {
  return statusMap[statusId] || defaultStatus;
};

export const getStatusIdFromText = (statusText: string): string => {
  const status = allStatuses.find(
    s => s.label.toLowerCase() === statusText.toLowerCase(),
  );
  return status?.id || 'UNKNOWN';
};

// Helper to get registration statuses only
export const getRegStatusInfo = (statusId: string): StatusConfig => {
  const regStatus = allRegStatuses.find(s => s.id === statusId);
  return regStatus || defaultStatus;
};

// Type exports
export type { StatusConfig };
