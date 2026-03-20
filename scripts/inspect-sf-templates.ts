/**
 * DepEd SF Template Inspector
 * Run: npx ts-node --skip-project scripts/inspect-sf-templates.ts
 * Logs every non-empty cell in each template sheet so we can build exact cell-mapping exports.
 */

const ExcelJS = require('exceljs')
const path = require('path')

const TEMPLATES_DIR = path.join(__dirname, '..', 'public', 'templates')

const FILES = [
  { file: 'SF1_2025_Grade 8 (Year II) - ARIES Mar 11, 2026.xlsx', label: 'SF1' },
  { file: 'SF2_2025_Grade 8 (Year II) - ARIES (2).xls', label: 'SF2', isXls: true },
  { file: 'SF 3 ARIES.xlsx', label: 'SF3' },
  { file: 'SF 4 ARIES.xlsx', label: 'SF4' },
  { file: 'SF 5 ARIES.xlsx', label: 'SF5' },
  { file: 'SF 6 ARIES.xlsx', label: 'SF6' },
  { file: 'SF5_2025_Grade 8 (Year II) - ARIES.xls', label: 'SF5-filled', isXls: true },
  { file: 'School-Forms-1-7 .xlsx', label: 'ALL-FORMS' },
  { file: 'Composite G8 ARIES.xlsx', label: 'Composite' },
]

async function inspectFile(label: string, filePath: string, isXls = false) {
  const wb = new ExcelJS.Workbook()
  try {
    if (isXls) {
      await wb.xlsx.readFile(filePath) // ExcelJS tries xlsx reader first
    } else {
      await wb.xlsx.readFile(filePath)
    }
  } catch (e: any) {
    console.log(`\n[${label}] ❌ Could not read: ${e.message}`)
    return
  }

  console.log(`\n${'='.repeat(80)}`)
  console.log(`[${label}] Sheets: ${wb.worksheets.map((s: any) => s.name).join(', ')}`)

  wb.worksheets.forEach((ws: any) => {
    console.log(`\n  ── Sheet: "${ws.name}" (rows: ${ws.rowCount}, cols: ${ws.columnCount}) ──`)
    for (let r = 1; r <= Math.min(ws.rowCount, 70); r++) {
      const row = ws.getRow(r)
      const nonEmpty: string[] = []
      row.eachCell({ includeEmpty: false }, (cell: any) => {
        const v = cell.value
        if (v !== null && v !== undefined && v !== '') {
          const val = typeof v === 'object' && v.text ? v.text : String(v).substring(0, 60)
          nonEmpty.push(`  ${cell.address}="${val}"`)
        }
      })
      if (nonEmpty.length > 0) {
        console.log(`    Row ${r}: ${nonEmpty.join('  |  ')}`)
      }
    }
  })
}

async function main() {
  for (const { file, label, isXls } of FILES) {
    const filePath = path.join(TEMPLATES_DIR, file)
    await inspectFile(label, filePath, isXls)
  }
}

main().catch(console.error)
