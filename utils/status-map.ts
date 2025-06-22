export const allRegStatuses = [
  {
    id: 'RAP',
    label: 'Approved',
    value: 'RAP',
    color: 'emerald',
    variant: 'registration-approved',
  },
  {
    id: 'RPP',
    label: 'Pending',
    value: 'RPP',
    color: 'sky',
    variant: 'registration-pending',
  },
  {
    id: 'RCN',
    label: 'Cancelled',
    value: 'RCN',
    color: 'red',
    variant: 'registration-cancelled',
  },
  {
    id: 'RAB',
    label: 'Abandoned',
    value: 'RAB',
    color: 'gray',
    variant: 'registration-abandoned',
  },
  {
    id: 'RIC',
    label: 'Incomplete',
    value: 'RIC',
    color: 'gray',
    variant: 'registration-incomplete',
  },
];

export const allTransStatuses = [
  {
    id: 'TCM',
    label: 'Completed',
    value: 'TCM',
    color: 'emerald',
    variant: 'transaction-completed',
  },
  {
    id: 'TIN',
    label: 'Incomplete',
    value: 'TIN',
    color: 'blue',
    variant: 'transaction-incomplete',
  },
  {
    id: 'TAB',
    label: 'Abandoned',
    value: 'TAB',
    color: 'gray',
    variant: 'transaction-abandoned',
  },
];

export const allTicketStatuses = [
  {
    id: 'TKS',
    label: 'Sold Out',
    value: 'TKS',
    color: 'purple',
    variant: 'ticket-sold-out',
  },
  {
    id: 'TKE',
    label: 'Expired',
    value: 'TKE',
    color: 'gray',
    variant: 'ticket-expired',
  },
  {
    id: 'TKA',
    label: 'Archived',
    value: 'TKA',
    color: 'slate',
    variant: 'ticket-archived',
  },
  {
    id: 'TKP',
    label: 'Pending',
    value: 'TKP',
    color: 'sky',
    variant: 'ticket-pending',
  },
  {
    id: 'TKO',
    label: 'On Sale',
    value: 'TKO',
    color: 'emerald',
    variant: 'ticket-on-sale',
  },
];

// Combine all statuses into a single array for easier management
const allStatuses = [...allRegStatuses, ...allTransStatuses, ...allTicketStatuses];

// Convert the array into an object for quick access
export const statusMap = allStatuses.reduce(
  (acc, status) => {
    acc[status.id] = { color: status.color, label: status.label, variant: status.variant };
    return acc;
  },
  {} as Record<string, { label: string, color: string, variant: string }>,
);

// Universal function to get status color and label
export const getStatusInfo = (statusId: string) => {
  return statusMap[statusId] || { color: 'default', label: 'Default', variant: 'default' };
};
