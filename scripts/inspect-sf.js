const ExcelJS = require('exceljs')
const path = require('path')

const TEMPLATES_DIR = path.join(__dirname, '..', 'public', 'templates')

const FILES = [
  { file: 'SF1_2025_Grade 8 (Year II) - ARIES Mar 11, 2026.xlsx', label: 'SF1' },
  { file: 'SF 3 ARIES.xlsx', label: 'SF3' },
  { file: 'SF 4 ARIES.xlsx', label: 'SF4' },
  { file: 'SF 5 ARIES.xlsx', label: 'SF5' },
  { file: 'SF 6 ARIES.xlsx', label: 'SF6' },
  { file: 'School-Forms-1-7 .xlsx', label: 'ALL-FORMS' },
  { file: 'Composite G8 ARIES.xlsx', label: 'Composite' },
  { file: 'WEEKLY-ATTENDANCE.xlsx', label: 'WeeklyAtt' },
]

async function inspectFile(label, filePath) {
  const wb = new ExcelJS.Workbook()
  try {
    await wb.xlsx.readFile(filePath)
  } catch (e) {
    console.log(`\n[${label}] Could NOT read: ${e.message}`)
    return
  }
  console.log(`\n${'='.repeat(80)}`)
  console.log(`[${label}] Sheets: ${wb.worksheets.map(s => s.name).join(' | ')}`)
  wb.worksheets.forEach(ws => {
    console.log(`\n  -- Sheet: "${ws.name}" (rows:${ws.rowCount} cols:${ws.columnCount}) --`)
    for (let r = 1; r <= Math.min(ws.rowCount, 70); r++) {
      const row = ws.getRow(r)
      const cells = []
      row.eachCell({ includeEmpty: false }, cell => {
        let v = cell.value
        if (v !== null && v !== undefined && v !== '') {
          if (typeof v === 'object' && v.text) v = v.text
          if (typeof v === 'object' && v.richText) v = v.richText.map(t => t.text).join('')
          cells.push(`${cell.address}="${String(v).substring(0, 50)}"`)
        }
      })
      if (cells.length > 0) console.log(`    R${r}: ${cells.join('  |  ')}`)
    }
  })
}

async function main() {
  for (const { file, label } of FILES) {
    await inspectFile(label, path.join(TEMPLATES_DIR, file))
  }
}
main().catch(console.error)
