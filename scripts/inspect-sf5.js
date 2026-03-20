const ExcelJS = require('exceljs')
const path = require('path')

const file = 'School-Forms-1-7 .xlsx'
const TEMPLATES_DIR = path.join(__dirname, '..', 'public', 'templates')

async function inspect() {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(path.join(TEMPLATES_DIR, file))
  const ws = wb.getWorksheet('School Form 5 (SF5)')
  
  for (let r = 1; r <= 15; r++) {
    const row = ws.getRow(r)
    const cells = []
    row.eachCell({ includeEmpty: false }, cell => {
      let v = cell.value
      if (v !== null && v !== undefined && v !== '') {
        if (typeof v === 'object' && v.text) v = v.text
        if (typeof v === 'object' && v.richText) v = v.richText.map(t => t.text).join('')
        cells.push(`${cell.address}="${String(v).substring(0, 50).replace(/\n/g, '\\n')}"`)
      }
    })
    if (cells.length > 0) console.log(`R${r}: ${cells.join('  |  ')}`)
  }
}
inspect().catch(console.error)
