// Reads the last exported SF3 file and prints column T values for all data rows
const ExcelJS = require('exceljs')
const path = require('path')
const fs = require('fs')
const os = require('os')

async function main() {
  // Look in Downloads folder for most recent SF3 xlsx
  const downloads = path.join(os.homedir(), 'Downloads')
  const files = fs.readdirSync(downloads)
    .filter(f => f.endsWith('.xlsx') && f.startsWith('Books_Issued'))
    .map(f => ({ name: f, mtime: fs.statSync(path.join(downloads, f)).mtime }))
    .sort((a, b) => b.mtime - a.mtime)

  if (!files.length) {
    console.log('No SF3 export found in Downloads. Checking sf3-test-output.xlsx instead.')
    return
  }

  const latest = path.join(downloads, files[0].name)
  console.log('Reading:', latest)

  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(latest)
  const ws = wb.getWorksheet('School Form 3 (SF3)')
  if (!ws) { console.log('SF3 sheet not found'); return }

  console.log('\n=== All data rows (12–80), ALL columns A–T:')
  for (let r = 12; r <= 80; r++) {
    const cells = []
    for (let c = 1; c <= 20; c++) {
      const cell = ws.getCell(r, c)
      const v = cell.value
      const txt = typeof v === 'object' && v !== null ? (v.richText ? v.richText.map(x=>x.text).join('') : JSON.stringify(v)).substring(0,20) : String(v ?? '')
      if (txt && txt !== 'null') cells.push(`${ws.getColumn(c).letter}="${txt}"`)
    }
    if (cells.length) console.log(`Row ${r}:`, cells.join(' | '))
  }
}

main().catch(console.error)
