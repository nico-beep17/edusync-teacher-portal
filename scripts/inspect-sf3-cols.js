const ExcelJS = require('exceljs')
const path = require('path')

async function main() {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(path.join(__dirname, '../public/templates/SF 3 ARIES.xlsx'))
  const ws = wb.worksheets[0]
  
  console.log('=== Sheet name:', ws.name)
  console.log('=== Rows 1-12:')
  for (let r = 1; r <= 12; r++) {
    const row = ws.getRow(r)
    const cells = []
    row.eachCell({ includeEmpty: false }, (cell, colNum) => {
      const letter = ws.getColumn(colNum).letter
      const val = typeof cell.value === 'object' && cell.value !== null
        ? JSON.stringify(cell.value).substring(0, 60)
        : String(cell.value || '').substring(0, 60)
      cells.push(`${letter}${r}="${val}"`)
    })
    if (cells.length) console.log(`Row ${r}:`, cells.join(' | '))
  }
  
  console.log('\n=== Row 11 (likely header) full scan:')
  const r11 = ws.getRow(11)
  r11.eachCell({ includeEmpty: false }, (cell, colNum) => {
    const letter = ws.getColumn(colNum).letter
    console.log(`  ${letter}: "${cell.value}"`)
  })

  console.log('\n=== Sample data row 12:')
  const r12 = ws.getRow(12)
  r12.eachCell({ includeEmpty: false }, (cell, colNum) => {
    const letter = ws.getColumn(colNum).letter
    console.log(`  ${letter}: "${cell.value}"`)
  })
}

main().catch(console.error)
