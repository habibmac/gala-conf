export const allRegStatuses = [
  {
    color: 'emerald',
    id: 'RAP',
    label: 'Approved',
    value: 'RAP',
  },
  {
    color: 'sky',
    id: 'RPP',
    label: 'Pending',
    value: 'RPP',
  },
  {
    color: 'red',
    id: 'RCN',
    label: 'Cancelled',
    value: 'RCN',
  },
];

export const allTransStatuses = [
  {
    color: 'emerald',
    id: 'TCM',
    label: 'Completed',
    value: 'TCM',
  },
  {
    color: 'blue',
    id: 'TIN',
    label: 'Incomplete',
    value: 'TIN',
  },
  {
    color: 'gray',
    id: 'TAB',
    label: 'Abandoned',
    value: 'TAB',
  },
];

export const allTicketStatuses = [
  {
    color: 'purple',
    id: 'TKS',
    label: 'Sold Out',
    value: 'TKS',
  },
  {
    color: 'gray',
    id: 'TKE',
    label: 'Expired',
    value: 'TKE',
  },
  {
    color: 'slate',
    id: 'TKA',
    label: 'Archived',
    value: 'TKA',
  },
  {
    color: 'sky',
    id: 'TKP',
    label: 'Pending',
    value: 'TKP',
  },
  {
    color: 'emerald',
    id: 'TKO',
    label: 'On Sale',
    value: 'TKO',
  },
];

// Combine all statuses into a single array for easier management
const allStatuses = [...allRegStatuses, ...allTransStatuses, ...allTicketStatuses];

// Convert the array into an object for quick access
export const statusMap = allStatuses.reduce(
  (acc, status) => {
    acc[status.id] = { color: status.color, label: status.label };
    return acc;
  },
  {} as Record<string, { label: string, color: string }>,
);

// Universal function to get status color and label
export const getStatusInfo = (statusId: string) => {
  return statusMap[statusId] || { color: 'default', label: 'Default' };
};
