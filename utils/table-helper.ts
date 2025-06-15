import type { CheckinColumnConfig, ColumnConfig } from '@/types';

export const calculateMinWidth = (columnConfigs: Ref<ColumnConfig[] | CheckinColumnConfig[]>, resultLength: Ref<number>) => {
  if (!columnConfigs.value)
    return 0;
  // If result is empty, return 0
  if (!resultLength.value || resultLength.value === 0) {
    return 0;
  }

  const totalWidth = columnConfigs.value
    .filter(config => config.isVisible)
    .reduce((total, config) => total + config.width * 15, 0); // Multiply by a factor to get reasonable width

  // Return the greater of the calculated width or minimum width (e.g., 1000px)
  return Math.max(totalWidth, 1000);
};
