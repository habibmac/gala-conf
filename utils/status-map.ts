export const allRegStatuses = [
  {
    id: 'RAP',
    label: 'Approved',
    value: 'RAP',
    color: 'emerald',
  },
  {
    id: 'RPP',
    label: 'Pending',
    value: 'RPP',
    color: 'sky',
  },
  {
    id: 'RCN',
    label: 'Cancelled',
    value: 'RCN',
    color: 'red',
  },
];

export const allTransStatuses = [
  {
    id: 'TCM',
    label: 'Completed',
    value: 'TCM',
    color: 'emerald',
  },
  {
    id: 'TIN',
    label: 'Incomplete',
    value: 'TIN',
    color: 'blue',
  },
  {
    id: 'TAB',
    label: 'Abandoned',
    value: 'TAB',
    color: 'gray',
  },
];

export const allTicketStatuses = [
  {
    id: 'TKS',
    label: 'Sold Out',
    value: 'TKS',
    color: 'purple',
  },
  {
    id: 'TKE',
    label: 'Expired',
    value: 'TKE',
    color: 'gray',
  },
  {
    id: 'TKA',
    label: 'Archived',
    value: 'TKA',
    color: 'slate',
  },
  {
    id: 'TKP',
    label: 'Pending',
    value: 'TKP',
    color: 'sky',
  },
  {
    id: 'TKO',
    label: 'On Sale',
    value: 'TKO',
    color: 'emerald',
  },
];

// Combine all statuses into a single array for easier management
const allStatuses = [...allRegStatuses, ...allTransStatuses, ...allTicketStatuses];

// Convert the array into an object for quick access
export const statusMap = allStatuses.reduce(
  (acc, status) => {
    acc[status.id] = { label: status.label, color: status.color };
    return acc;
  },
  {} as Record<string, { label: string; color: string }>
);

// Universal function to get status color and label
export const getStatusInfo = (statusId: string) => {
  return statusMap[statusId] || { color: 'default', label: 'Default' };
};
