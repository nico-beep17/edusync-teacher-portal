const ExcelJS = require('exceljs')
const path = require('path')

const TEMPLATES_DIR = path.join(__dirname, '..', 'public', 'templates')
const file = 'School-Forms-1-7 .xlsx'

async function inspectSF4() {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(path.join(TEMPLATES_DIR, file))
  
  const sf4Name = wb.worksheets.find(s => s.name.includes('SF4') || s.name.includes('SF 4'))?.name
  const ws = wb.getWorksheet(sf4Name)
  
  for (let r = 1; r <= 9; r++) {
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

inspectSF4().catch(console.error)
