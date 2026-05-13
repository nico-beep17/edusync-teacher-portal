import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import ExcelJS from 'exceljs'
import path from 'path'
import fs from 'fs'
import { generateToken, validateToken } from '@/lib/csrf'
import { checkRateLimit, cleanupRateLimits } from '@/lib/rateLimit'

// ─── Shared Style Helpers ─────────────────────────────────────────────────────
const GREEN = '1C6B40'
const LIGHT_GREEN = 'E8F7EE'
const SLATE = '111A24'
const MUTED = '8898AC'

function hFont(size = 10, bold = true, argb = 'FF' + SLATE): Partial<ExcelJS.Font> {
  return { name: 'Arial', size, bold, color: { argb } }
}
// ExcelJS requires non-Partial Fill — use this helper everywhere
function fill(argb: string): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + argb } } as ExcelJS.Fill
}
function bFont(size = 9, bold = false, argb = 'FF' + SLATE): Partial<ExcelJS.Font> {
  return { name: 'Arial', size, bold, color: { argb } }
}
function cAlign(wrap = false): Partial<ExcelJS.Alignment> {
  return { horizontal: 'center', vertical: 'middle', wrapText: wrap }
}
function lAlign(): Partial<ExcelJS.Alignment> {
  return { horizontal: 'left', vertical: 'middle' }
}
function tBorder(color = 'C8D4E0'): Partial<ExcelJS.Borders> {
  const s = { style: 'thin' as ExcelJS.BorderStyle, color: { argb: 'FF' + color } }
  return { top: s, bottom: s, left: s, right: s }
}
function getCellText(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object' && value.richText) {
    return value.richText.map((rt: any) => rt.text || '').join('');
  }
  if (typeof value === 'object' && value.result !== undefined) {
    return String(value.result);
  }
  return String(value);
}

// ─── Grade-Level Template Resolver ────────────────────────────────────────────
// Returns the correct template file path based on grade level.
// SF1-7: All grade levels use the same blank DepEd template.
// SF8:   Universal nutritional status form.
// SF9:   JHS only (ES version is .docx — not supported).
// SF10:  Grade-specific permanent academic record.
// SHS:   Senior High School forms (Grades 11-12).
function getGradeNum(gradeLevel: string | number | undefined): number {
  if (!gradeLevel) return 8
  const s = String(gradeLevel).replace(/[^0-9]/g, '')
  return parseInt(s) || 8
}

function getTemplatePath(formType: string, gradeLevel?: string | number): string {
  const grade = getGradeNum(gradeLevel)
  const base = path.join(process.cwd(), 'public', 'templates')

  switch (formType) {
    case 'sf1': case 'sf2': case 'sf3': case 'sf4': case 'sf5': case 'sf6': case 'sf7':
      return path.join(base, 'School Forms (1-7).xlsx')

    case 'sf8':
      return path.join(base, 'SF8.xlsx')

    case 'sf9':
      return path.join(base, 'SF9-JHS.xlsx')

    case 'sf10':
      if (grade >= 11) return path.join(base, 'SF10-SHS.xlsx')
      if (grade >= 7)  return path.join(base, 'SF10-JHS-2025.xlsx')
      if (grade >= 4)  return path.join(base, 'SF10-ES-G4.xlsx')
      return path.join(base, 'SF10-ES-G1.xlsx')

    case 'shs':
      return path.join(base, 'Senior High School Forms.xlsx')

    case 'composite':
      return path.join(base, 'Composite G8 ARIES.xlsx')

    default:
      return path.join(base, 'School Forms (1-7).xlsx')
  }
}

// ─── SF1 Route (Masterlist) ───────────────────────────────────────────────────
async function buildSF1(students: any[], schoolInfo: any) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'DepAid'
  const ws = wb.addWorksheet('School Form 1 (SF1)', {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1 }
  })

  // Column widths
  ws.getColumn(1).width = 5   // No.
  ws.getColumn(2).width = 16  // LRN
  ws.getColumn(3).width = 32  // Name
  ws.getColumn(4).width = 12  // Birthday
  ws.getColumn(5).width = 8   // Sex
  ws.getColumn(6).width = 10  // Age
  ws.getColumn(7).width = 15  // Mother Tongue
  ws.getColumn(8).width = 10  // Status

  const si = schoolInfo || {}

  // Header block
  ws.mergeCells('A1:H1')
  ws.getCell('A1').value = 'Republic of the Philippines — Department of Education'
  ws.getCell('A1').font = hFont(9, true, 'FF' + GREEN)
  ws.getCell('A1').alignment = cAlign()
  ws.getRow(1).height = 14

  ws.mergeCells('A2:H2')
  ws.getCell('A2').value = 'SCHOOL FORM 1 (SF1) — School Register'
  ws.getCell('A2').font = hFont(13, true)
  ws.getCell('A2').alignment = cAlign()
  ws.getRow(2).height = 20

  const infoRows: [string, string][] = [
    ['School Name:', si.schoolName || ''],
    ['School ID:', si.schoolId || ''],
    ['Grade Level & Section:', `${si.gradeLevel || 'Grade 8'} - ${si.section || ''}`],
    ['School Year:', si.schoolYear || '2025-2026'],
    ['Division:', si.division || ''],
    ['Region:', si.region || ''],
    ['Class Adviser:', si.adviserName || ''],
  ]

  let infoRow = 3
  infoRows.forEach(([label, value]) => {
    ws.mergeCells(infoRow, 1, infoRow, 3)
    ws.mergeCells(infoRow, 4, infoRow, 8)
    ws.getRow(infoRow).getCell(1).value = label
    ws.getRow(infoRow).getCell(1).font = bFont(9, true)
    ws.getRow(infoRow).getCell(4).value = value
    ws.getRow(infoRow).getCell(4).font = bFont(9)
    ws.getRow(infoRow).height = 13
    infoRow++
  })

  // Table header
  const headerRow = ws.getRow(infoRow)
  headerRow.height = 18
  ;['No.', 'LRN', "Learner's Name (Last, First, M.I.)", 'Birth Date', 'Sex', 'Age', 'Mother Tongue', 'Status'].forEach((h, i) => {
    const cell = headerRow.getCell(i + 1)
    cell.value = h
    cell.font = hFont(9, true, 'FFFFFFFF')
    cell.alignment = cAlign(true)
    cell.fill = fill(GREEN)
    cell.border = tBorder('FFFFFF')
  })

  const males = students.filter((s: any) => s.sex === 'M')
  const females = students.filter((s: any) => s.sex === 'F')

  let dataRow = infoRow + 1

  // Male section header
  ws.mergeCells(dataRow, 1, dataRow, 8)
  ws.getRow(dataRow).getCell(1).value = 'MALE'
  ws.getRow(dataRow).getCell(1).font = hFont(9, true, 'FF1040A0')
  ws.getRow(dataRow).getCell(1).fill = fill('EEF5FF')
  ws.getRow(dataRow).getCell(1).border = tBorder()
  ws.getRow(dataRow).height = 13
  dataRow++

  males.forEach((s: any, i: number) => {
    const row = ws.getRow(dataRow)
    row.height = 14
    const values = [i + 1, s.lrn, s.name, s.birthday || '', s.sex, s.age || '', s.motherTongue || '', s.status || 'Enrolled']
    values.forEach((v, ci) => {
      const cell = row.getCell(ci + 1)
      cell.value = v
      cell.font = bFont(9)
      cell.alignment = ci === 2 ? lAlign() : cAlign()
      cell.border = tBorder()
      if (i % 2 === 1) cell.fill = fill('F8FAFD')
    })
    dataRow++
  })

  // Female section header
  ws.mergeCells(dataRow, 1, dataRow, 8)
  ws.getRow(dataRow).getCell(1).value = 'FEMALE'
  ws.getRow(dataRow).getCell(1).font = hFont(9, true, 'FFA03080')
  ws.getRow(dataRow).getCell(1).fill = fill('FFF0F8')
  ws.getRow(dataRow).getCell(1).border = tBorder()
  ws.getRow(dataRow).height = 13
  dataRow++

  females.forEach((s: any, i: number) => {
    const row = ws.getRow(dataRow)
    row.height = 14
    const values = [males.length + i + 1, s.lrn, s.name, s.birthday || '', s.sex, s.age || '', s.motherTongue || '', s.status || 'Enrolled']
    values.forEach((v, ci) => {
      const cell = row.getCell(ci + 1)
      cell.value = v
      cell.font = bFont(9)
      cell.alignment = ci === 2 ? lAlign() : cAlign()
      cell.border = tBorder()
      if (i % 2 === 1) cell.fill = fill('F8FAFD')
    })
    dataRow++
  })

  // Totals
  ws.mergeCells(dataRow, 1, dataRow, 2)
  ws.getRow(dataRow).getCell(1).value = 'TOTAL ENROLLMENT'
  ws.getRow(dataRow).getCell(1).font = hFont(9, true, 'FFFFFFFF')
  ws.getRow(dataRow).getCell(1).fill = fill(GREEN)
  ws.getRow(dataRow).getCell(1).alignment = { horizontal: 'right', vertical: 'middle' }
  ws.mergeCells(dataRow, 3, dataRow, 4)
  ws.getRow(dataRow).getCell(3).value = students.length
  ws.getRow(dataRow).getCell(3).font = hFont(11, true, 'FFFFFFFF')
  ws.getRow(dataRow).getCell(3).fill = fill(GREEN)
  ws.getRow(dataRow).getCell(3).alignment = cAlign()
  ws.mergeCells(dataRow, 5, dataRow, 6)
  ws.getRow(dataRow).getCell(5).value = `Male: ${males.length}`
  ws.getRow(dataRow).getCell(5).font = hFont(9, true, 'FFFFFFFF')
  ws.getRow(dataRow).getCell(5).fill = fill(GREEN)
  ws.getRow(dataRow).getCell(5).alignment = cAlign()
  ws.mergeCells(dataRow, 7, dataRow, 8)
  ws.getRow(dataRow).getCell(7).value = `Female: ${females.length}`
  ws.getRow(dataRow).getCell(7).font = hFont(9, true, 'FFFFFFFF')
  ws.getRow(dataRow).getCell(7).fill = fill(GREEN)
  ws.getRow(dataRow).getCell(7).alignment = cAlign()
  ws.getRow(dataRow).height = 16

  dataRow++
  // Signature
  ws.mergeCells(dataRow, 1, dataRow, 4)
  ws.mergeCells(dataRow, 5, dataRow, 8)
  ws.getRow(dataRow).getCell(1).value = `Prepared by:\n\n${si.adviserName || '_____________________'}\nClass Adviser`
  ws.getRow(dataRow).getCell(5).value = `Noted by:\n\n_____________________\nSchool Head / Principal`
  ;[1, 5].forEach(c => {
    ws.getRow(dataRow).getCell(c).font = bFont(9)
    ws.getRow(dataRow).getCell(c).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  })
  ws.getRow(dataRow).height = 42

  return wb
}

// Helper to remove all sheets except the target one
function keepOnlySheet(wb: ExcelJS.Workbook, sheetName: string) {
  const idsToRemove: number[] = []
  wb.worksheets.forEach(s => {
    if (!s.name.includes(sheetName)) {
      idsToRemove.push(s.id)
    }
  })
  idsToRemove.forEach(id => wb.removeWorksheet(id))
}

// ─── SF2 Route (Daily Attendance) ─────────────────────────────────────────────
async function buildSF2(students: any[], attendance: Record<string, any[]>, schoolInfo: any, year: number, month: number) {
  const templatePath = getTemplatePath('sf2', schoolInfo?.gradeLevel)
  
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${path.basename(templatePath)}`)

  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(templatePath)

  const sf2SheetName = wb.worksheets.find(s => s.name.includes('SF2') || s.name.includes('SF 2'))?.name
  if (!sf2SheetName) throw new Error("Could not find SF2 sheet in template")
  const ws = wb.getWorksheet(sf2SheetName)
  if (!ws) throw new Error("SF2 worksheet is undefined")

  keepOnlySheet(wb, sf2SheetName)

  // Clear formulas to prevent shared formula crashes
  ws.eachRow((row) => {
    row.eachCell((cell) => {
      if (cell.type === ExcelJS.ValueType.Formula) {
         cell.value = cell.result as any;
      }
    });
  });

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const monthName = MONTHS[month]
  const si = schoolInfo || {}

  // Fill Header Data
  ws.getCell('C6').value = si.schoolId || ''
  ws.getCell('K6').value = si.schoolYear || '2025-2026'
  ws.getCell('X6').value = monthName.toUpperCase()
  ws.getCell('C8').value = si.schoolName || ''
  ws.getCell('X8').value = si.gradeLevel || '8'
  ws.getCell('AC8').value = si.section || ''

  // Dates handling
  const totalDays = new Date(year, month + 1, 0).getDate()
  const weekdays: { d: number, dayName: string }[] = []
  for (let d = 1; d <= totalDays; d++) {
    const dow = new Date(year, month, d).getDay()
    if (dow !== 0 && dow !== 6) weekdays.push({ d, dayName: ['S','M','T','W','TH','F','S'][dow] })
  }

  const dateCols = ['D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','AA','AB']
  
  weekdays.forEach((dayObj, i) => {
      if (i < 25) {
          const cDate = ws.getCell(`${dateCols[i]}12`)
          const cDay = ws.getCell(`${dateCols[i]}13`)
          cDate.value = dayObj.d
          cDay.value = dayObj.dayName
          cDate.font = { name: 'Arial', size: 8, bold: true }
          cDay.font = { name: 'Arial', size: 8, bold: true }
          cDate.alignment = { horizontal: 'center', vertical: 'middle' }
          cDay.alignment = { horizontal: 'center', vertical: 'middle' }
      }
  })

  // Ensure date/day rows are tall enough to be readable
  ws.getRow(12).height = 15
  ws.getRow(13).height = 15

  // ─── Dynamic Row Placements for SF2 Matrix ────────────────────────────────────
  const males = students.filter((s: any) => s.sex === 'M')
  const females = students.filter((s: any) => s.sex === 'F')

  let maleHeaderRow = 0
  let femaleHeaderRow = 0
  for (let r = 1; r < 120; r++) {
    const val = getCellText(ws.getCell(`B${r}`).value).toUpperCase().trim()
    if (!maleHeaderRow && (val === 'MALE' || (val.includes('MALE') && !val.includes('FEMALE')))) maleHeaderRow = r
    if (!femaleHeaderRow && (val === 'FEMALE' || val.includes('FEMALE'))) femaleHeaderRow = r
  }
  if (!maleHeaderRow) maleHeaderRow = 13
  if (!femaleHeaderRow) femaleHeaderRow = 48

  let maleStartRow = maleHeaderRow + 1
  let maleTotalRow = femaleHeaderRow - 1
  let maleCapacity = maleTotalRow - maleStartRow

  let insertedMaleRows = 0
  if (males.length > maleCapacity) {
    insertedMaleRows = males.length - maleCapacity
    for (let i = 0; i < insertedMaleRows; i++) {
      ws.insertRow(maleTotalRow + i, [])
    }
    femaleHeaderRow += insertedMaleRows
    maleTotalRow += insertedMaleRows
  }

  let currentRow = maleStartRow
  males.forEach((student: any) => {
      ws.getCell(`B${currentRow}`).value = student.name
      let absentCount = 0, tardyCount = 0
      weekdays.slice(0, 25).forEach((dayObj, i) => {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayObj.d).padStart(2, '0')}`
          const rec = (attendance[student.lrn] || []).find(r => r.date === dateStr)
          if (rec) {
              if (rec.status === 'P') ws.getCell(`${dateCols[i]}${currentRow}`).value = "" 
              if (rec.status === 'A') { ws.getCell(`${dateCols[i]}${currentRow}`).value = "X"; absentCount++ }
              if (rec.status === 'L') { ws.getCell(`${dateCols[i]}${currentRow}`).value = "L"; tardyCount++ }
          }
      })
      const summaryFont = { name: 'Arial Narrow', size: 11, bold: false }
      ws.getCell(`AC${currentRow}`).value = absentCount
      ws.getCell(`AC${currentRow}`).alignment = { horizontal: 'right', vertical: 'middle' }
      ws.getCell(`AC${currentRow}`).font = summaryFont
      ws.getCell(`AC${currentRow}`).numFmt = 'General'
      ws.getCell(`AD${currentRow}`).value = tardyCount
      ws.getCell(`AD${currentRow}`).alignment = { horizontal: 'right', vertical: 'middle' }
      ws.getCell(`AD${currentRow}`).font = summaryFont
      ws.getCell(`AD${currentRow}`).numFmt = 'General'
      currentRow++
  })

  // ─── MALE TOTAL Per Day ───────────────────────────────────────────────────────
  weekdays.slice(0, 25).forEach((dayObj, i) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayObj.d).padStart(2, '0')}`
    let presentCount = 0
    males.forEach(s => {
      const rec = (attendance[s.lrn] || []).find(r => r.date === dateStr)
      if (rec && rec.status !== 'A') presentCount++
    })
    ws.getCell(`${dateCols[i]}${maleTotalRow}`).value = presentCount > 0 ? presentCount : ''
  })

  let femaleStartRow = femaleHeaderRow + 1

  // Find female total row dynamically
  let femaleTotalRow = femaleStartRow + 1
  let combinedTotalRow = femaleStartRow + 2
  for (let r = femaleStartRow; r < femaleStartRow + 60 + insertedMaleRows; r++) {
    const val = getCellText(ws.getCell(`B${r}`).value).toUpperCase().trim()
    if (val.includes('TOTAL')) {
      if (val.includes('FEMALE')) {
        femaleTotalRow = r
      } else if (!val.includes('MALE')) {
        combinedTotalRow = r
        break
      }
    }
  }
  if (femaleTotalRow <= femaleStartRow) femaleTotalRow = femaleStartRow + 25
  if (combinedTotalRow <= femaleTotalRow) combinedTotalRow = femaleTotalRow + 1

  let femaleCapacity = femaleTotalRow - femaleStartRow
  let insertedFemaleRows = 0
  if (females.length > femaleCapacity) {
    insertedFemaleRows = females.length - femaleCapacity
    for (let i = 0; i < insertedFemaleRows; i++) {
      ws.insertRow(femaleTotalRow + i, [])
    }
    combinedTotalRow += insertedFemaleRows
    femaleTotalRow += insertedFemaleRows
  }

  currentRow = femaleStartRow
  females.forEach((student: any) => {
      ws.getCell(`B${currentRow}`).value = student.name
      let absentCount = 0, tardyCount = 0
      weekdays.slice(0, 25).forEach((dayObj, i) => {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayObj.d).padStart(2, '0')}`
          const rec = (attendance[student.lrn] || []).find(r => r.date === dateStr)
          if (rec) {
              if (rec.status === 'P') ws.getCell(`${dateCols[i]}${currentRow}`).value = "" 
              if (rec.status === 'A') { ws.getCell(`${dateCols[i]}${currentRow}`).value = "X"; absentCount++ }
              if (rec.status === 'L') { ws.getCell(`${dateCols[i]}${currentRow}`).value = "L"; tardyCount++ }
          }
      })
      const fSummaryFont = { name: 'Arial Narrow', size: 11, bold: false }
      ws.getCell(`AC${currentRow}`).value = absentCount
      ws.getCell(`AC${currentRow}`).alignment = { horizontal: 'right', vertical: 'middle' }
      ws.getCell(`AC${currentRow}`).font = fSummaryFont
      ws.getCell(`AC${currentRow}`).numFmt = 'General'
      ws.getCell(`AD${currentRow}`).value = tardyCount
      ws.getCell(`AD${currentRow}`).alignment = { horizontal: 'right', vertical: 'middle' }
      ws.getCell(`AD${currentRow}`).font = fSummaryFont
      ws.getCell(`AD${currentRow}`).numFmt = 'General'
      currentRow++
  })

  // ─── FEMALE TOTAL Per Day & Combined TOTAL ────────────────────────────────────
  weekdays.slice(0, 25).forEach((dayObj, i) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayObj.d).padStart(2, '0')}`
    let fPresentCount = 0
    females.forEach(s => {
      const rec = (attendance[s.lrn] || []).find(r => r.date === dateStr)
      if (rec && rec.status !== 'A') fPresentCount++
    })
    const maleVal = typeof ws.getCell(`${dateCols[i]}${maleTotalRow}`).value === 'number' ? ws.getCell(`${dateCols[i]}${maleTotalRow}`).value as number : 0
    ws.getCell(`${dateCols[i]}${femaleTotalRow}`).value = fPresentCount > 0 ? fPresentCount : ''
    const combined = maleVal + fPresentCount
    ws.getCell(`${dateCols[i]}${combinedTotalRow}`).value = combined > 0 ? combined : ''
  })

  // ─── Summary for the Month (rows 77-97) ──────────────────────────
  const schoolDays = weekdays.length
  const maleCount = males.length
  const femaleCount = females.length
  const totalCount = maleCount + femaleCount

  // Compute average daily attendance from data
  let mTotalPresent = 0, fTotalPresent = 0
  for (const dayObj of weekdays) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayObj.d).padStart(2, '0')}`
    males.forEach(s => {
      if ((attendance[s.lrn] || []).some(r => r.date === dateStr && r.status === 'P')) mTotalPresent++
    })
    females.forEach(s => {
      if ((attendance[s.lrn] || []).some(r => r.date === dateStr && r.status === 'P')) fTotalPresent++
    })
  }
  const mDailyAvg = schoolDays > 0 ? Math.round(mTotalPresent / schoolDays) : 0
  const fDailyAvg = schoolDays > 0 ? Math.round(fTotalPresent / schoolDays) : 0
  const tDailyAvg = mDailyAvg + fDailyAvg

  const mPct = maleCount > 0 ? Math.round((mDailyAvg / maleCount) * 100) : 0
  const fPct = femaleCount > 0 ? Math.round((fDailyAvg / femaleCount) * 100) : 0
  const tPct = totalCount > 0 ? Math.round((tDailyAvg / totalCount) * 100) : 0

  // User-supplied summary fields (from payload)
  const sf2Summary = (schoolInfo as any)?.sf2Summary || {}

  const summaryShift = insertedMaleRows + insertedFemaleRows
  const sBase = (base: number) => base + summaryShift

  // Helper: set value on vertically-merged pair, clearing any percentage numFmt and rotation
  const setSummaryCell = (col: string, topRow: number, val: number | string) => {
    const botRow = topRow + 1
    try { ws.unMergeCells(`${col}${topRow}:${col}${botRow}`) } catch {}
    const cTop = ws.getCell(`${col}${topRow}`)
    const cBot = ws.getCell(`${col}${botRow}`)
    cTop.value = val
    cBot.value = null
    cTop.numFmt = 'General'
    cBot.numFmt = 'General'
    cTop.alignment = { horizontal: 'center', vertical: 'middle', textRotation: 0 }
    cBot.alignment = { horizontal: 'center', vertical: 'middle', textRotation: 0 }
    ws.mergeCells(`${col}${topRow}:${col}${botRow}`)
  }

  // R77: Month & No. of Days
  ws.mergeCells(`AB${sBase(77)}:AD${sBase(77)}`)
  ws.getCell(`AB${sBase(77)}`).value = `Month:  ${monthName}`
  ws.getCell(`AB${sBase(77)}`).font = { name: 'Arial Narrow', size: 11, bold: true }
  ws.getCell(`AB${sBase(77)}`).alignment = { vertical: 'middle' }
  ws.getCell(`AG${sBase(77)}`).value = schoolDays
  ws.getCell(`AG${sBase(77)}`).font = { name: 'Arial', size: 11, bold: true }
  ws.getCell(`AG${sBase(77)}`).alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getColumn('AG').width = 8

  // R79-80: Enrollment as of 1st Friday of June
  setSummaryCell('AH', sBase(79), sf2Summary.enrollmentM ?? maleCount)
  setSummaryCell('AI', sBase(79), sf2Summary.enrollmentF ?? femaleCount)
  setSummaryCell('AJ', sBase(79), (sf2Summary.enrollmentM ?? maleCount) + (sf2Summary.enrollmentF ?? femaleCount))

  // R81-82: Late Enrollment
  setSummaryCell('AH', sBase(81), sf2Summary.lateEnrollmentM ?? 0)
  setSummaryCell('AI', sBase(81), sf2Summary.lateEnrollmentF ?? 0)
  setSummaryCell('AJ', sBase(81), (sf2Summary.lateEnrollmentM ?? 0) + (sf2Summary.lateEnrollmentF ?? 0))

  // R83-84: Registered Learner as of end of month
  setSummaryCell('AH', sBase(83), maleCount + (sf2Summary.lateEnrollmentM ?? 0))
  setSummaryCell('AI', sBase(83), femaleCount + (sf2Summary.lateEnrollmentF ?? 0))
  setSummaryCell('AJ', sBase(83), totalCount + (sf2Summary.lateEnrollmentM ?? 0) + (sf2Summary.lateEnrollmentF ?? 0))

  // R85-86: Percentage of Enrollment
  const regM = maleCount + (sf2Summary.lateEnrollmentM ?? 0)
  const regF = femaleCount + (sf2Summary.lateEnrollmentF ?? 0)
  const regT = regM + regF
  const enrollM = sf2Summary.enrollmentM ?? maleCount
  const enrollF = sf2Summary.enrollmentF ?? femaleCount
  const enrollT = enrollM + enrollF
  setSummaryCell('AH', sBase(85), enrollM > 0 ? Math.round((regM / enrollM) * 100) : 0)
  setSummaryCell('AI', sBase(85), enrollF > 0 ? Math.round((regF / enrollF) * 100) : 0)
  setSummaryCell('AJ', sBase(85), enrollT > 0 ? Math.round((regT / enrollT) * 100) : 0)

  // R87: Average Daily Attendance (single row)
  ws.getCell(`AH${sBase(87)}`).value = mDailyAvg
  ws.getCell(`AI${sBase(87)}`).value = fDailyAvg
  ws.getCell(`AJ${sBase(87)}`).value = tDailyAvg

  // R88-89: Percentage of Attendance
  setSummaryCell('AH', sBase(88), mPct)
  setSummaryCell('AI', sBase(88), fPct)
  setSummaryCell('AJ', sBase(88), tPct)

  // R90-91: 5 consecutive absences (auto-computed)
  let consAbsM = 0, consAbsF = 0
  const checkConsecutive = (studentLrn: string) => {
    let streak = 0
    for (const dayObj of weekdays) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayObj.d).padStart(2, '0')}`
      const isAbsent = (attendance[studentLrn] || []).some(r => r.date === dateStr && r.status === 'A')
      if (isAbsent) { streak++ } else { streak = 0 }
      if (streak >= 5) return true
    }
    return false
  }
  males.forEach(s => { if (checkConsecutive(s.lrn)) consAbsM++ })
  females.forEach(s => { if (checkConsecutive(s.lrn)) consAbsF++ })
  setSummaryCell('AH', sBase(90), String(consAbsM))
  setSummaryCell('AI', sBase(90), String(consAbsF))
  setSummaryCell('AJ', sBase(90), String(consAbsM + consAbsF))

  // R92-93: Drop out
  setSummaryCell('AH', sBase(92), sf2Summary.dropOutM ?? 0)
  setSummaryCell('AI', sBase(92), sf2Summary.dropOutF ?? 0)
  setSummaryCell('AJ', sBase(92), (sf2Summary.dropOutM ?? 0) + (sf2Summary.dropOutF ?? 0))

  // R94-95: Transferred out
  setSummaryCell('AH', sBase(94), sf2Summary.transferredOutM ?? 0)
  setSummaryCell('AI', sBase(94), sf2Summary.transferredOutF ?? 0)
  setSummaryCell('AJ', sBase(94), (sf2Summary.transferredOutM ?? 0) + (sf2Summary.transferredOutF ?? 0))

  // R96-97: Transferred in
  setSummaryCell('AH', sBase(96), sf2Summary.transferredInM ?? 0)
  setSummaryCell('AI', sBase(96), sf2Summary.transferredInF ?? 0)
  setSummaryCell('AJ', sBase(96), (sf2Summary.transferredInM ?? 0) + (sf2Summary.transferredInF ?? 0))

  // Signature
  ws.mergeCells(`AD${sBase(101)}:AI${sBase(101)}`)
  ws.getCell(`AD${sBase(101)}`).value = si.adviserName || ''
  ws.getCell(`AD${sBase(101)}`).alignment = { horizontal: 'center', vertical: 'bottom' }
  ws.getCell(`AD${sBase(101)}`).font = { name: 'Arial', size: 11, bold: true }
  ws.getCell(`AD${sBase(101)}`).border = { bottom: { style: 'thin' } }

  return wb
}

// ─── SF4 Route (Monthly Movement) ──────────────────────────────────────────────
async function buildSF4(students: any[], attendance: Record<string, any[]>, schoolInfo: any, year: number, month: number) {
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const monthName = MONTHS[month]

  // Read template
  const templatePath = getTemplatePath('sf4', schoolInfo?.gradeLevel)
  
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${path.basename(templatePath)}`)

  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(templatePath)

  const sf4SheetName = wb.worksheets.find(s => s.name.includes('SF4') || s.name.includes('SF 4'))?.name
  if (!sf4SheetName) throw new Error("Could not find SF4 sheet in template")
  const ws = wb.getWorksheet(sf4SheetName)
  if (!ws) throw new Error("SF4 worksheet is undefined")

  keepOnlySheet(wb, sf4SheetName)

  const si = schoolInfo || {}

  // Fill Header Data
  // R4: I4=Region, N4=Division, Y4=District
  ws.getCell('I4').value = si.region || ''
  ws.getCell('N4').value = si.division || ''
  ws.getCell('Y4').value = si.district || ''
  
  // R5: D5=School ID
  ws.getCell('D5').value = si.schoolId || ''

  // R7: F7=School Name, Z7=School Year, AJ7=Month
  ws.getCell('F7').value = si.schoolName || ''
  ws.getCell('Z7').value = si.schoolYear || '2025-2026'
  ws.getCell('AJ7').value = monthName

  // Compute stats for Grade 8
  const males = students.filter(s => s.sex === 'M')
  const females = students.filter(s => s.sex === 'F')

  const totalDaysInMonth = new Date(year, month + 1, 0).getDate()
  let schoolDaysCount = 0
  let mTotalPresent = 0
  let fTotalPresent = 0

  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dow = new Date(year, month, d).getDay()
    if (dow !== 0 && dow !== 6) { // Weekdays only
      schoolDaysCount++
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      
      males.forEach(s => {
        if ((attendance[s.lrn] || []).some(r => r.date === dateStr && r.status === 'P')) mTotalPresent++
      })
      females.forEach(s => {
        if ((attendance[s.lrn] || []).some(r => r.date === dateStr && r.status === 'P')) fTotalPresent++
      })
    }
  }

  const mDailyAvg = schoolDaysCount > 0 ? (mTotalPresent / schoolDaysCount) : 0
  const fDailyAvg = schoolDaysCount > 0 ? (fTotalPresent / schoolDaysCount) : 0
  const tDailyAvg = mDailyAvg + fDailyAvg

  const mPct = males.length > 0 ? ((mDailyAvg / males.length) * 100) : 0
  const fPct = females.length > 0 ? ((fDailyAvg / females.length) * 100) : 0
  const tPct = students.length > 0 ? ((tDailyAvg / students.length) * 100) : 0

  const injectRow = (rowNum: number, mReg: number, fReg: number, mAvg: number, fAvg: number, tAvg: number, mPer: number, fPer: number, tPer: number) => {
    ws.getCell(`E${rowNum}`).value = mReg
    ws.getCell(`F${rowNum}`).value = fReg
    ws.getCell(`G${rowNum}`).value = mReg + fReg
    ws.getCell(`H${rowNum}`).value = Math.round(mAvg)
    ws.getCell(`I${rowNum}`).value = Math.round(fAvg)
    ws.getCell(`J${rowNum}`).value = Math.round(tAvg)
    ws.getCell(`K${rowNum}`).value = mPer > 0 ? (Math.round(mPer * 100) / 100) + '%' : '0%'
    ws.getCell(`L${rowNum}`).value = fPer > 0 ? (Math.round(fPer * 100) / 100) + '%' : '0%'
    ws.getCell(`M${rowNum}`).value = tPer > 0 ? (Math.round(tPer * 100) / 100) + '%' : '0%'
  }

  // Inject for INDIVIDUAL TEACHER SECTION (Row 12)
  ws.getCell('A12').value = si.adviserName || ''
  ws.getCell('C12').value = si.gradeLevel || '8'
  ws.getCell('D12').value = si.section || ''
  injectRow(12, males.length, females.length, mDailyAvg, fDailyAvg, tDailyAvg, mPct, fPct, tPct)

  // Inject for Grade 8 Summary
  injectRow(30, males.length, females.length, mDailyAvg, fDailyAvg, tDailyAvg, mPct, fPct, tPct)

  // Inject for Total (Row 36)
  injectRow(36, males.length, females.length, mDailyAvg, fDailyAvg, tDailyAvg, mPct, fPct, tPct)

  // Signatures
  ws.getCell('AE50').value = si.adviserName || ''
  ws.getCell('AN50').value = si.schoolHeadName || 'MYRNA EVANGELISTA PURIFICACION'

  return wb
}

// ─── SF5 Route (Promotion & Proficiency) ───────────────────────────────────────
async function buildSF5(students: any[], schoolInfo: any) {
  const templatePath = getTemplatePath('sf5', schoolInfo?.gradeLevel)
  
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${path.basename(templatePath)}`)

  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(templatePath)

  const ws = wb.getWorksheet('School Form 5 (SF5)')
  if (!ws) throw new Error("SF5 worksheet not found")
  
  keepOnlySheet(wb, ws.name)

  const si = schoolInfo || {}

  // Fill Header Data
  // R3: B3=Region, D3=Division, I3=District
  ws.getCell('B3').value = si.region || ''
  ws.getCell('D3').value = si.division || ''
  ws.getCell('I3').value = si.district || ''
  
  // R5: B5=School ID, F5=School Year, I5=Curriculum
  ws.getCell('B5').value = si.schoolId || ''
  ws.getCell('F5').value = si.schoolYear || '2025-2026'

  // R7: B7=School Name, I7=Grade Level, K7=Section
  ws.getCell('B7').value = si.schoolName || ''
  ws.getCell('I7').value = si.gradeLevel || 'Grade 8'
  ws.getCell('K7').value = si.section || ''

  // Inject Students
  const males = students.filter((s: any) => s.sex === 'M')
  const females = students.filter((s: any) => s.sex === 'F')

  let mTotal = 33
  let fTotal = 60
  ws.eachRow((r, i) => {
      r.eachCell((c) => {
          const v = getCellText(c.value).toUpperCase()
          if(v.includes('TOTAL MALE')) mTotal = i
          if(v.includes('TOTAL FEMALE')) fTotal = i
      })
  })

  // Males
  for(let r = 12; r < mTotal; r++) {
       const student = males[r - 12]
       if(student) {
            ws.getCell(`A${r}`).value = student.lrn
            ws.getCell(`B${r}`).value = student.name
            ws.getCell(`F${r}`).value = student.average > 0 ? student.average : ""
            ws.getCell(`G${r}`).value = student.status || ""
       } else {
            ws.getCell(`A${r}`).value = ""
            ws.getCell(`B${r}`).value = ""
            ws.getCell(`F${r}`).value = ""
            ws.getCell(`G${r}`).value = ""
       }
  }

  // Females
  const fStart = mTotal + 2
  for(let r = fStart; r < fTotal; r++) {
       const student = females[r - fStart]
       if(student) {
            ws.getCell(`A${r}`).value = student.lrn
            ws.getCell(`B${r}`).value = student.name
            ws.getCell(`F${r}`).value = student.average > 0 ? student.average : ""
            ws.getCell(`G${r}`).value = student.status || ""
       } else {
            ws.getCell(`A${r}`).value = ""
            ws.getCell(`B${r}`).value = ""
            ws.getCell(`F${r}`).value = ""
            ws.getCell(`G${r}`).value = ""
       }
  }

  return wb
}

// ─── SF3 Route (Books Issued) ─────────────────────────────────────────────────
// books is now: Record<lrn, Record<subjectKey, { dateIssued?, dateReturned? }>>
async function buildSF3(students: any[], books: Record<string, Record<string, any>>, schoolInfo: any) {
  const templatePath = getTemplatePath('sf3', schoolInfo?.gradeLevel)
  
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${path.basename(templatePath)}`)

  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(templatePath)

  const ws = wb.getWorksheet('School Form 3 (SF3)')
  if (!ws) throw new Error("SF3 worksheet not found")

  keepOnlySheet(wb, ws.name)

  const si = schoolInfo || {}

  // Fill Header Data
  ws.getCell('C5').value = si.schoolId || ''
  ws.getCell('K5').value = si.schoolYear || '2025-2026'
  ws.getCell('C7').value = si.schoolName || ''
  ws.getCell('K7').value = si.gradeLevel || 'Grade 8'
  ws.getCell('N7').value = si.section || ''

  // ── Fixed subject → column mapping matching the real SF3 template layout ─────
  // Template columns confirmed by inspection: D/E=Filipino EL, F/G=Music Arts,
  // H/I=Physical Education Health, J/K=Science, L/M=Filipino, N/O=ESP,
  // P/Q=Mathematics, R/S=extra (8th slot)
  const SUBJECT_COL_MAP: Record<string, [string, string]> = {
    'Filipino EL':        ['D', 'E'],
    'Music Arts':         ['F', 'G'],
    'Physical Education': ['H', 'I'],
    'Health':             ['H', 'I'],  // shares PE column (template says "PE Health")
    'Science':            ['J', 'K'],
    'Filipino':           ['L', 'M'],
    'ESP':                ['N', 'O'],
    'Mathematics':        ['P', 'Q'],
  }
  // All 8 column pairs in order (for pre-clearing)
  const cols: [string, string][] = [
    ['D', 'E'], ['F', 'G'], ['H', 'I'], ['J', 'K'],
    ['L', 'M'], ['N', 'O'], ['P', 'Q'], ['R', 'S']
  ]

  const fmtDate = (iso?: string) => {
    if (!iso) return ''
    try {
      const d = new Date(iso + 'T00:00:00')
      return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: '2-digit' })
    } catch { return iso }
  }

  // Remarks/Action Taken is column T in the SF3 template (confirmed from template inspection)
  // Column T contains richText so dynamic scanning won't match plain string search
  const remarksCol = 'T'
  // Don't overwrite the template's subject headers — they already have the correct book titles
  // (removing the header injection that was overwriting rich-text headers)

  // Group students M then F
  const males = students.filter((s: any) => s.sex === 'M')
  const females = students.filter((s: any) => s.sex === 'F')

  let maleTotalRow = 12
  while(ws.getCell(`B${maleTotalRow}`).value !== null && !getCellText(ws.getCell(`B${maleTotalRow}`).value).toUpperCase().includes('TOTAL FOR MALE') && maleTotalRow < 100) {
      maleTotalRow++
  }
  
  let femaleStartRow = maleTotalRow + 1
  let femaleTotalRow = femaleStartRow
  while(ws.getCell(`B${femaleTotalRow}`).value !== null && !getCellText(ws.getCell(`B${femaleTotalRow}`).value).toUpperCase().includes('TOTAL FOR FEMALE') && femaleTotalRow < 150) {
      femaleTotalRow++
  }

  // ── Pre-clear ALL data rows in template before writing ──────────────────────
  const clearRow = (r: number) => {
    ws.getCell(`A${r}`).value = ''
    ws.getCell(`B${r}`).value = ''
    ws.getCell(`C${r}`).value = ''
    ws.getCell(`${remarksCol}${r}`).value = ''
    cols.forEach(c => {
      ws.getCell(`${c[0]}${r}`).value = ''
      ws.getCell(`${c[1]}${r}`).value = ''
    })
  }
  for (let r = 12; r < maleTotalRow; r++) clearRow(r)
  for (let r = femaleStartRow; r < femaleTotalRow; r++) clearRow(r)

  const injectRow = (student: any | null, rowNum: number, idx: number) => {
    if (student) {
      ws.getCell(`A${rowNum}`).value = idx + 1
      ws.getCell(`B${rowNum}`).value = student.name
      ws.getCell(`C${rowNum}`).value = student.name
      const sBooks = books[student.lrn] || {}
      // Write each subject to its FIXED column from the template map
      const remarksArr: string[] = []
      Object.entries(sBooks).forEach(([subject, rec]: [string, any]) => {
        const colPair = SUBJECT_COL_MAP[subject]
        if (!colPair) return // unknown subject — skip
        ws.getCell(`${colPair[0]}${rowNum}`).value = fmtDate(rec.dateIssued)
        // Date Returned cell: actual date if returned, else FM/TDO/NEG code if set
        if (rec.dateReturned) {
          ws.getCell(`${colPair[1]}${rowNum}`).value = fmtDate(rec.dateReturned)
        } else if (rec.returnCode) {
          ws.getCell(`${colPair[1]}${rowNum}`).value = rec.returnCode
          ws.getCell(`${colPair[1]}${rowNum}`).font = { name: 'Arial', size: 8, bold: true, color: { argb: 'FFCC0000' } }
          ws.getCell(`${colPair[1]}${rowNum}`).alignment = { horizontal: 'center', vertical: 'middle' }
        } else {
          ws.getCell(`${colPair[1]}${rowNum}`).value = ''
        }
        // Collect remarks (LLTR/TLTR/PTL) for the Remark/Action Taken column
        if (rec.remarks) remarksArr.push(rec.remarks)
      })
      const allRemarks = remarksArr.join('; ')
      ws.getCell(`${remarksCol}${rowNum}`).value = allRemarks || null
      ws.getCell(`${remarksCol}${rowNum}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      ws.getCell(`${remarksCol}${rowNum}`).font = { name: 'Arial', size: 8 }
    } else {
      ws.getCell(`A${rowNum}`).value = ''
      ws.getCell(`B${rowNum}`).value = ''
    }
  }

  for (let i = 0; i < (maleTotalRow - 12); i++) {
    injectRow(males[i] || null, 12 + i, i)
  }
  for (let i = 0; i < (femaleTotalRow - femaleStartRow); i++) {
    injectRow(females[i] || null, femaleStartRow + i, i)
  }


  // "Prepared By" signature (teacher name)
  // Find the row containing "Prepared by" in the template, otherwise use a known fixed row
  let prepRow = 0
  ws.eachRow((row, ri) => {
    row.eachCell(c => {
      if (getCellText(c.value).toLowerCase().includes('prepared') && !prepRow) prepRow = ri
    })
  })
  if (prepRow > 0) {
    ws.getCell(`${remarksCol}${prepRow + 1}`).value = si.adviserName || ''
    ws.getCell(`${remarksCol}${prepRow + 1}`).font = { name: 'Arial', size: 10, bold: true }
    ws.getCell(`${remarksCol}${prepRow + 1}`).alignment = { horizontal: 'center', vertical: 'middle' }
  }

  return wb
}

// ─── Composite Route (Quarterly Grades) ───────────────────────────────────────
async function buildComposite(students: any[]) {
  const templatePath = getTemplatePath('composite')
  
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${path.basename(templatePath)}`)

  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(templatePath)

  const ws = wb.getWorksheet('1ST QTR')
  if (!ws) throw new Error("1ST QTR worksheet not found")

  // Clear formulas to prevent "Shared Formula master must exist" crash
  ws.eachRow((row) => {
    row.eachCell((cell) => {
      if (cell.type === ExcelJS.ValueType.Formula) {
         cell.value = cell.result as any;
      }
    });
  });

  // Dynamic Row Finder
  let maleStart = 5
  let femaleStart = 33
  for(let r = 1; r < 80; r++) {
      const val = getCellText(ws.getCell(`C${r}`).value).toUpperCase()
      if(val === "MALE" || val.includes("MALE") && !val.includes("FEMALE")) maleStart = r + 1
      if(val === "FEMALE" || val.includes("FEMALE")) femaleStart = r + 1
  }

  const subjectsMapping: Record<string, string> = {
      'Filipino': 'D',
      'English': 'E',
      'Mathematics': 'F',
      'Science': 'G',
      'Ap': 'H',
      'Esp': 'I',
      'Epp/tle': 'J',
      'Mapeh': 'O'
  };

  const getSGrade = (grades: any[], sub: string) => {
      const m = grades.find(g => g.subject.toLowerCase().includes(sub.toLowerCase()))
      return m && m.quarterGrade > 0 ? m.quarterGrade : ''
  }

  const males = students.filter((s: any) => s.sex === 'M')
  const females = students.filter((s: any) => s.sex === 'F')

  // Inject Males (up to Female - 1)
  for(let r = maleStart; r < (femaleStart - 1); r++) {
      const student = males[r - maleStart]
      if (student) {
          ws.getCell(`C${r}`).value = student.name
          Object.entries(subjectsMapping).forEach(([sub, col]) => {
              ws.getCell(`${col}${r}`).value = getSGrade(student.grades || [], sub)
          })
          ws.getCell(`P${r}`).value = student.average > 0 ? student.average : ""
      } else {
          ws.getCell(`C${r}`).value = ""
          Object.values(subjectsMapping).forEach(col => ws.getCell(`${col}${r}`).value = "")
          ws.getCell(`P${r}`).value = ""
      }
  }

  // Inject Females (up to row 80 max usually)
  for(let r = femaleStart; r < 80; r++) {
      const student = females[r - femaleStart]
      if (student) {
          ws.getCell(`C${r}`).value = student.name
          Object.entries(subjectsMapping).forEach(([sub, col]) => {
              ws.getCell(`${col}${r}`).value = getSGrade(student.grades || [], sub)
          })
          ws.getCell(`P${r}`).value = student.average > 0 ? student.average : ""
      } else {
          ws.getCell(`C${r}`).value = ""
          Object.values(subjectsMapping).forEach(col => ws.getCell(`${col}${r}`).value = "")
          ws.getCell(`P${r}`).value = ""
      }
  }

  return wb
}

// ─── SF6 Route (Promotion Summary) ────────────────────────────────────────────
async function buildSF6(students: any[], schoolInfo: any) {
  const templatePath = getTemplatePath('sf6', schoolInfo?.gradeLevel)
  
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${path.basename(templatePath)}`)

  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(templatePath)

  const ws = wb.getWorksheet('School Form 6 (SF6)')
  if (!ws) throw new Error("SF6 worksheet not found")

  keepOnlySheet(wb, ws.name)

  const si = schoolInfo || {}

  // Fill Header Data
  ws.getCell('B5').value = si.schoolId || ''
  ws.getCell('H5').value = si.region || ''
  ws.getCell('M5').value = si.division || ''
  ws.getCell('B7').value = si.schoolName || ''
  ws.getCell('M7').value = si.district || ''
  ws.getCell('T7').value = si.schoolYear || '2025-2026'

  let promotedM = 0, promotedF = 0
  let retainedM = 0, retainedF = 0
  let pendingM = 0, pendingF = 0

  let bM = 0, bF = 0     // < 75
  let dM = 0, dF = 0     // 75 - 79
  let apM = 0, apF = 0   // 80 - 84
  let pM = 0, pF = 0     // 85 - 89
  let aM = 0, aF = 0     // >= 90

  students.forEach(s => {
      const avg = s.average || 0
      const isM = s.sex === 'M'
      
      if (avg >= 75) isM ? promotedM++ : promotedF++
      else if (avg > 0) isM ? retainedM++ : retainedF++
      else isM ? pendingM++ : pendingF++

      if (avg > 0) {
          if (avg < 75) isM ? bM++ : bF++
          else if (avg < 80) isM ? dM++ : dF++
          else if (avg < 85) isM ? apM++ : apF++
          else if (avg < 90) isM ? pM++ : pF++
          else isM ? aM++ : aF++
      }
  })

  // We are injecting into Grade 8 columns (F: Male, G: Female, H: Total)
  // Promotion Status
  ws.getCell('F11').value = promotedM
  ws.getCell('G11').value = promotedF
  ws.getCell('H11').value = promotedM + promotedF

  ws.getCell('F12').value = pendingM // Mapping conditionally promoted/incomplete here
  ws.getCell('G12').value = pendingF
  ws.getCell('H12').value = pendingM + pendingF

  ws.getCell('F13').value = retainedM
  ws.getCell('G13').value = retainedF
  ws.getCell('H13').value = retainedM + retainedF

  // Proficiency Levels
  ws.getCell('F16').value = bM
  ws.getCell('G16').value = bF
  ws.getCell('H16').value = bM + bF

  ws.getCell('F18').value = dM
  ws.getCell('G18').value = dF
  ws.getCell('H18').value = dM + dF

  ws.getCell('F20').value = apM
  ws.getCell('G20').value = apF
  ws.getCell('H20').value = apM + apF

  ws.getCell('F22').value = pM
  ws.getCell('G22').value = pF
  ws.getCell('H22').value = pM + pF

  ws.getCell('F24').value = aM
  ws.getCell('G24').value = aF
  ws.getCell('H24').value = aM + aF

  const totalM = bM + dM + apM + pM + aM
  const totalF = bF + dF + apF + pF + aF
  ws.getCell('F26').value = totalM
  ws.getCell('G26').value = totalF
  ws.getCell('H26').value = totalM + totalF

  // Signatures
  ws.getCell('A30').value = `Prepared and Submitted by:\n${si.adviserName || ''}`

  return wb
}

// ─── SF8 Route (Health & Nutrition) ───────────────────────────────────────────
async function buildSF8(students: any[], schoolInfo: any) {
  const templatePath = getTemplatePath('sf8', schoolInfo?.gradeLevel)
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${path.basename(templatePath)}`)
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(templatePath)

  const ws = wb.getWorksheet('Nutritional Status')
  if (!ws) throw new Error("Nutritional Status sheet not found")

  const si = schoolInfo || {}
  ws.getCell('C5').value = si.schoolName || ''
  ws.getCell('H5').value = si.district || ''
  ws.getCell('K5').value = si.division || ''
  ws.getCell('N5').value = si.region || ''
  ws.getCell('A7').value = si.schoolId || ''
  ws.getCell('E7').value = si.gradeLevel || ''
  ws.getCell('G7').value = si.section || ''
  ws.getCell('N7').value = si.schoolYear || ''

  const males = students.filter(s => s.sex === 'M').sort((a,b) => a.name.localeCompare(b.name))
  const females = students.filter(s => s.sex === 'F').sort((a,b) => a.name.localeCompare(b.name))

  // Find Male and Female start rows
  let mStart = 12, fStart = 65
  for (let r = 10; r <= 80; r++) {
    const val = getCellText(ws.getCell(`A${r}`).value).toUpperCase()
    if (val.includes('MALE') && !val.includes('FEMALE')) mStart = r + 1
    if (val.includes('FEMALE')) fStart = r + 1
  }

  // Populate Males
  males.forEach((m, idx) => {
    const r = mStart + idx
    ws.getCell(`A${r}`).value = idx + 1
    ws.getCell(`B${r}`).value = m.lrn
    ws.getCell(`C${r}`).value = m.name
  })

  // Populate Females
  females.forEach((f, idx) => {
    const r = fStart + idx
    ws.getCell(`A${r}`).value = idx + 1
    ws.getCell(`B${r}`).value = f.lrn
    ws.getCell(`C${r}`).value = f.name
  })

  return wb
}

// ─── SF9 Route (Report Card) ──────────────────────────────────────────────────
async function buildSF9(students: any[], grades: Record<string, any[]>, schoolInfo: any, attendance: Record<string, any[]>, exportMode: string, studentLrn?: string) {
  const templatePath = getTemplatePath('sf9', schoolInfo?.gradeLevel)
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${path.basename(templatePath)}`)
  
  const targetStudents = exportMode === 'specific_student' && studentLrn 
    ? students.filter(s => s.lrn === studentLrn)
    : students

  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  let singleWb: ExcelJS.Workbook | null = null

  for (const student of targetStudents) {
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.readFile(templatePath)
    
    // Basic Injection
    const ws1 = wb.getWorksheet('Sheet1') // Grades sheet usually
    const ws2 = wb.getWorksheet('Sheet2') // Attendance sheet usually
    if (ws2) {
      ws2.getCell('P15').value = `Name: ${student.name}`
      ws2.getCell('P16').value = `Learner's Reference Number: ${student.lrn}`
      ws2.getCell('P17').value = `Age: _____    Sex: ${student.sex}`
      ws2.getCell('P18').value = `Grade: ${schoolInfo?.gradeLevel || ''} Section: ${schoolInfo?.section || ''}`
      ws2.getCell('P20').value = `School Year: ${schoolInfo?.schoolYear || ''}`
    }

    if (exportMode === 'specific_student') {
      singleWb = wb
      break
    } else {
      const buffer = await wb.xlsx.writeBuffer()
      zip.file(`SF9_${student.name.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`, buffer as ArrayBuffer)
    }
  }

  if (exportMode === 'specific_student') return singleWb
  return zip
}

// ─── SF10 Route (Permanent Record) ────────────────────────────────────────────
async function buildSF10(students: any[], grades: Record<string, any[]>, schoolInfo: any, exportMode: string, studentLrn?: string) {
  const templatePath = getTemplatePath('sf10', schoolInfo?.gradeLevel)
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${path.basename(templatePath)}`)
  
  const targetStudents = exportMode === 'specific_student' && studentLrn 
    ? students.filter(s => s.lrn === studentLrn)
    : students

  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  let singleWb: ExcelJS.Workbook | null = null

  for (const student of targetStudents) {
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.readFile(templatePath)
    
    // Basic Injection
    const front = wb.getWorksheet(1) // Usually front sheet
    if (front) {
      // Basic info
      const isES = templatePath.includes('-ES')
      const isSHS = templatePath.includes('-SHS')
      
      if (isSHS) {
        // Handle SHS specific fields
      } else if (isES) {
        // Handle ES specific fields
        front.getCell('C5').value = `LAST NAME: ${student.name.split(',')[0] || ''}`
        front.getCell('I5').value = `FIRST NAME: ${student.name.split(',')[1] || ''}`
        front.getCell('O6').value = `Birthdate (mm/dd/yyyy): `
        front.getCell('AA6').value = `Sex: ${student.sex === 'M' ? 'Male' : 'Female'}`
      } else {
        // JHS
        front.getCell('A7').value = `LAST NAME: ${student.name.split(',')[0] || ''}`
        front.getCell('E7').value = `FIRST NAME: ${student.name.split(',')[1] || ''}  NAME EXTN. (Jr,I,II): _______`
        front.getCell('F8').value = `Birthdate (mm/dd/yyyy): `
        front.getCell('K8').value = `Sex: ${student.sex === 'M' ? 'Male' : 'Female'}`
      }
    }

    if (exportMode === 'specific_student') {
      singleWb = wb
      break
    } else {
      const buffer = await wb.xlsx.writeBuffer()
      zip.file(`SF10_${student.name.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`, buffer as ArrayBuffer)
    }
  }

  if (exportMode === 'specific_student') return singleWb
  return zip
}

// ─── GET handler (CSRF token provisioning) ──────────────────────────────────────
export async function GET() {
  const token = generateToken()
  // Also set the token as a cookie so the client can read it back
  const resp = NextResponse.json({ csrfToken: token })
  resp.cookies.set('csrf-token', token, {
    path: '/',
    sameSite: 'strict',
    httpOnly: false, // client needs to read it for the header
    secure: process.env.NODE_ENV === 'production',
    maxAge: 3600, // 1 hour
  })
  return resp
}

// ─── Router ───────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // ── Rate Limiting ───────────────────────────────────────────────────────
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || '127.0.0.1'
    cleanupRateLimits()
    if (!checkRateLimit(ip, 'export/sf')) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    // ── CSRF Validation ─────────────────────────────────────────────────────
    const csrfHeader = req.headers.get('x-csrf-token')
    const csrfCookie = req.cookies.get('csrf-token')?.value
    if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie || !validateToken(csrfHeader)) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { form, students, attendance, schoolInfo, year, month, grades, exportMode, studentLrn } = body

    let wbOrZip: ExcelJS.Workbook | any // any to allow JSZip
    let filename: string
    let contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

    if (form === 'sf1') {
      wbOrZip = await buildSF1(students, schoolInfo)
      filename = `SF1_${(schoolInfo?.section || 'Section').replace(/\s/g, '_')}_${schoolInfo?.schoolYear || '2025-2026'}.xlsx`
    } else if (form === 'sf2') {
      const y = year ?? new Date().getFullYear()
      const m = month ?? new Date().getMonth()
      wbOrZip = await buildSF2(students, attendance || {}, schoolInfo, y, m)
      const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
      filename = `SF2_${MONTHS[m]}_${y}_${(schoolInfo?.section || 'Section').replace(/\s/g, '_')}.xlsx`
    } else if (form === 'sf4') {
      const y = year ?? new Date().getFullYear()
      const m = month ?? new Date().getMonth()
      wbOrZip = await buildSF4(students, attendance || {}, schoolInfo, y, m)
      const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
      filename = `SF4_${MONTHS[m]}_${y}_${(schoolInfo?.section || 'Section').replace(/\s/g, '_')}.xlsx`
    } else if (form === 'sf3') {
      wbOrZip = await buildSF3(students, body.books || {}, schoolInfo)
      filename = `SF3_${(schoolInfo?.section || 'Section').replace(/\s/g, '_')}_Report.xlsx`
    } else if (form === 'sf5') {
      wbOrZip = await buildSF5(students, schoolInfo)
      filename = `SF5_${(schoolInfo?.section || 'Section').replace(/\s/g, '_')}_Report.xlsx`
    } else if (form === 'sf6') {
      wbOrZip = await buildSF6(students, schoolInfo)
      filename = `SF6_${(schoolInfo?.section || 'Section').replace(/\s/g, '_')}_Report.xlsx`
    } else if (form === 'sf8') {
      wbOrZip = await buildSF8(students, schoolInfo)
      filename = `SF8_${(schoolInfo?.section || 'Section').replace(/\s/g, '_')}_Report.xlsx`
    } else if (form === 'sf9') {
      wbOrZip = await buildSF9(students, grades || {}, schoolInfo, attendance || {}, exportMode || 'specific_student', studentLrn)
      if (exportMode === 'zip_archive' || (!exportMode && !studentLrn)) {
        filename = `SF9_${(schoolInfo?.section || 'Section').replace(/\s/g, '_')}_Archive.zip`
        contentType = 'application/zip'
      } else {
        filename = `SF9_${studentLrn || 'Report'}.xlsx`
      }
    } else if (form === 'sf10') {
      wbOrZip = await buildSF10(students, grades || {}, schoolInfo, exportMode || 'specific_student', studentLrn)
      if (exportMode === 'zip_archive' || (!exportMode && !studentLrn)) {
        filename = `SF10_${(schoolInfo?.section || 'Section').replace(/\s/g, '_')}_Archive.zip`
        contentType = 'application/zip'
      } else {
        filename = `SF10_${studentLrn || 'Report'}.xlsx`
      }
    } else if (form === 'composite') {
      wbOrZip = await buildComposite(students)
      filename = `Composite_Grades_${(schoolInfo?.section || 'Section').replace(/\s/g, '_')}.xlsx`
    } else {
      return Response.json({ error: 'Unknown form type. Supported: sf1, sf2, sf3, sf4, sf5, sf6, sf8, sf9, sf10, composite' }, { status: 400 })
    }

    let buffer: ArrayBuffer
    if (contentType === 'application/zip') {
      buffer = await wbOrZip.generateAsync({ type: "nodebuffer" })
    } else {
      buffer = await wbOrZip.xlsx.writeBuffer()
    }

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error: any) {
    console.error('SF Export Error:', error)
    return Response.json({ error: error.message || 'Export failed' }, { status: 500 })
  }
}
