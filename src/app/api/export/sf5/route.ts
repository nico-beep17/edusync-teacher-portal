import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs/promises';

export async function POST(req: Request) {
  try {
    const { students } = await req.json();

    const templateName = 'School-Forms-1-7 .xlsx';
    const templatePath = path.join(process.cwd(), 'public', 'templates', templateName);

    try {
        await fs.access(templatePath);
    } catch {
       return NextResponse.json({ error: `Template ${templateName} not found` }, { status: 404 });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);

    const sheet = workbook.getWorksheet('School Form 5 (SF5)');
    if (!sheet) {
        return NextResponse.json({ error: 'Could not find SF5 Worksheet' }, { status: 500 });
    }

    let maleRow = 15;
    for(let r = 5; r < 40; r++) {
        const val = String(sheet.getCell(`B${r}`).value).toUpperCase() + String(sheet.getCell(`A${r}`).value).toUpperCase();
        if(val.includes("MALE") && !val.includes("FEMALE")) {
            maleRow = r + 1;
            break;
        }
    }

    let currentRow = maleRow;
    const males = students.filter((s: any) => s.sex === 'M');
    males.forEach((student: any, idx: number) => {
        sheet.getCell(`A${currentRow}`).value = student.lrn;
        sheet.getCell(`B${currentRow}`).value = student.name;
        sheet.getCell(`F${currentRow}`).value = student.average > 0 ? student.average : ""; 
        sheet.getCell(`G${currentRow}`).value = student.average > 0 ? (student.average >= 75 ? 'PROMOTED' : 'RETAINED') : ""; 
        currentRow++;
    });

    let femaleStartRow = currentRow + 1;
    for(let r = currentRow; r < 100; r++) {
        const val = String(sheet.getCell(`B${r}`).value).toUpperCase() + String(sheet.getCell(`A${r}`).value).toUpperCase();
        if(val.includes("FEMALE") || val.includes("FEMALES")) {
            femaleStartRow = r + 1;
            break;
        }
    }
    
    currentRow = femaleStartRow;
    const females = students.filter((s: any) => s.sex === 'F');
    females.forEach((student: any, idx: number) => {
        sheet.getCell(`A${currentRow}`).value = student.lrn;
        sheet.getCell(`B${currentRow}`).value = student.name;
        sheet.getCell(`F${currentRow}`).value = student.average > 0 ? student.average : ""; 
        sheet.getCell(`G${currentRow}`).value = student.average > 0 ? (student.average >= 75 ? 'PROMOTED' : 'RETAINED') : ""; 
        currentRow++;
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
       status: 200,
       headers: {
           'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
           'Content-Disposition': `attachment; filename="SF5_Report_Export.xlsx"`
       }
    });

  } catch (error: any) {
    console.error("SF5 Export Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to export' }, { status: 500 });
  }
}
