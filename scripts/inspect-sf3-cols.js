const ExcelJS = require('exceljs')
const path = require('path')

async function main() {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(path.join(__dirname, '../public/templates/School-Forms-1-7 .xlsx'))
  
  console.log('=== Worksheets:')
  wb.worksheets.forEach(ws => console.log(' -', ws.name))
  
  const ws = wb.getWorksheet('School Form 3 (SF3)')
  if (!ws) { console.log('SF3 sheet NOT FOUND'); return }
  
  console.log('\n=== SF3 Sheet, Rows 1-13:')
  for (let r = 1; r <= 13; r++) {
    const row = ws.getRow(r)
    const cells = []
    row.eachCell({ includeEmpty: false }, (cell, colNum) => {
      const letter = ws.getColumn(colNum).letter
      const val = typeof cell.value === 'object' && cell.value !== null && cell.value.richText
        ? '[richText]:' + cell.value.richText.map(t => t.text).join('').substring(0, 40)
        : String(cell.value || '').substring(0, 50)
      cells.push(`${letter}="${val}"`)
    })
    if (cells.length) console.log(`Row ${r}:`, cells.join(' | '))
  }

  console.log('\n=== Row 9 full (column headers):')
  ws.getRow(9).eachCell({ includeEmpty: false }, (cell, colNum) => {
    const letter = ws.getColumn(colNum).letter
    const val = typeof cell.value === 'object' && cell.value !== null && cell.value.richText
      ? '[richText]:' + cell.value.richText.map(t => t.text).join('').substring(0, 60)
      : String(cell.value || '').substring(0, 60)
    console.log(`  ${letter}:`, val)
  })
  
  console.log('\n=== Last column with data in row 9:')
  let lastCol = 0
  ws.getRow(9).eachCell({ includeEmpty: false }, (_, colNum) => { lastCol = colNum })
  const last = ws.getColumn(lastCol)
  console.log(`  Last col: ${last.letter} (index ${lastCol})`)
}

main().catch(console.error)
