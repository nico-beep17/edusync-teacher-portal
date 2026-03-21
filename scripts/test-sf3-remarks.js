const ExcelJS = require('exceljs')
const path = require('path')
const fs = require('fs')

async function main() {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(path.join(__dirname, '../public/templates/School-Forms-1-7 .xlsx'))
  const ws = wb.getWorksheet('School Form 3 (SF3)')

  // Simulate: student BULAHAN, ROVIC L. with Filipino EL - issued, NOT returned, remark = LLTR
  const testBooks = {
    "101010101012": {
      "Filipino EL": {
        dateIssued: "2026-03-21",
        dateReturned: "", 
        remarks: "LLTR"
      }
    }
  }

  const remarksCol = 'T'
  const cols = [['D','E'],['F','G'],['H','I'],['J','K'],['L','M'],['N','O'],['P','Q'],['R','S']]
  const fmtDate = (iso) => {
    if (!iso) return ''
    try { const d = new Date(iso + 'T00:00:00'); return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: '2-digit' }) } catch { return iso }
  }

  const bookTitles = ['Filipino EL']

  // Clear row 12
  ws.getCell('A12').value = ''
  ws.getCell('B12').value = ''
  ws.getCell('C12').value = ''
  ws.getCell('T12').value = ''
  cols.forEach(c => { ws.getCell(`${c[0]}12`).value = ''; ws.getCell(`${c[1]}12`).value = '' })

  // Write test student
  ws.getCell('A12').value = 1
  ws.getCell('B12').value = 'BULAHAN, ROVIC L.'
  ws.getCell('C12').value = 'BULAHAN, ROVIC L.'

  const sBooks = testBooks['101010101012'] || {}
  const allRemarks = bookTitles.map(title => {
    const rec = sBooks[title] || {}
    console.log(`  title="${title}" rec=`, JSON.stringify(rec))
    return (!rec.dateReturned && rec.remarks) ? rec.remarks : null
  }).filter(Boolean).join('; ')

  console.log('allRemarks:', allRemarks)

  bookTitles.forEach((title, colIdx) => {
    const rec = sBooks[title] || {}
    ws.getCell(`${cols[colIdx][0]}12`).value = fmtDate(rec.dateIssued)
    ws.getCell(`${cols[colIdx][1]}12`).value = fmtDate(rec.dateReturned)
    console.log(`  Written: ${cols[colIdx][0]}12 = "${fmtDate(rec.dateIssued)}", ${cols[colIdx][1]}12 = "${fmtDate(rec.dateReturned)}"`)
  })

  ws.getCell(`T12`).value = allRemarks || null
  console.log(`  Written: T12 = "${allRemarks}"`)

  const outPath = path.join(__dirname, '../public/templates/sf3-test-output.xlsx')
  await wb.xlsx.writeFile(outPath)
  console.log('\nWritten to:', outPath)

  // Verify: read it back
  const wb2 = new ExcelJS.Workbook()
  await wb2.xlsx.readFile(outPath)
  const ws2 = wb2.getWorksheet('School Form 3 (SF3)')
  console.log('\n=== Row 12 readback:')
  for (const col of ['A','B','C','D','E','T']) {
    const val = ws2.getCell(`${col}12`).value
    console.log(`  ${col}12:`, typeof val === 'object' && val !== null ? JSON.stringify(val).substring(0,60) : val)
  }
}

main().catch(console.error)
