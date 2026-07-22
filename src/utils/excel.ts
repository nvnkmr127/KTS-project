import * as XLSX from 'xlsx-js-style';

const HEADER_STYLE = {
  font: { bold: true },
  fill: { fgColor: { rgb: 'FFFF00' } },
  border: {
    top: { style: 'thin', color: { rgb: '000000' } },
    bottom: { style: 'thin', color: { rgb: '000000' } },
    left: { style: 'thin', color: { rgb: '000000' } },
    right: { style: 'thin', color: { rgb: '000000' } }
  }
};

// Styles the header row (bold, yellow, bordered), wraps the sheet in a
// workbook, and triggers the download.
export function downloadSheet(ws: XLSX.WorkSheet, sheetName: string, filename: string, skipHeaderStyle?: boolean) {
  if (!skipHeaderStyle) {
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell = ws[XLSX.utils.encode_cell({ c: C, r: 0 })];
      if (cell) cell.s = HEADER_STYLE;
    }
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}
