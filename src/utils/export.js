import * as XLSX from 'xlsx'

export function exportToExcel(data, columns, filename) {
  const header = columns.map((column) => column.label)
  const rows = data.map((row) => columns.map((column) => row[column.prop] ?? ''))
  const sheet = XLSX.utils.aoa_to_sheet([header, ...rows])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Sheet1')
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

