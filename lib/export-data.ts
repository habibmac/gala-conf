import { utils, write } from '@e965/xlsx';

interface ExportData {
  [key: string]: string | number | boolean | Date;
}

export function exportToCSV(data: ExportData[], filename: string) {
  // Convert data to CSV string
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','), // Header row
    ...data.map((row) =>
      headers
        .map((header) => {
          const cell = row[header]?.toString() || '';
          // Escape quotes and wrap in quotes if contains comma
          return cell.includes(',') ? `"${cell.replace(/"/g, '""')}"` : cell;
        })
        .join(',')
    ),
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToXLSX(data: ExportData[], filename: string) {
  // Create workbook and worksheet
  const worksheet = utils.json_to_sheet(data);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  // Generate buffer and create blob
  const excelBuffer = write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  // Download file
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${filename}.xlsx`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
