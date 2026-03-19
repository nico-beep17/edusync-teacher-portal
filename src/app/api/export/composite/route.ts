import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs/promises';

export async function POST(req: Request) {
  try {
    const { students } = await req.json();

    const templateName = 'Composite G8 ARIES.xlsx';
    const templatePath = path.join(process.cwd(), 'public', 'templates', templateName);

    try {
        await fs.access(templatePath);
    } catch {
       return NextResponse.json({ error: `Template ${templateName} not found` }, { status: 404 });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);

    const sheet = workbook.getWorksheet('1ST QTR');
    if (!sheet) {
        return NextResponse.json({ error: 'Could not find 1ST QTR Worksheet' }, { status: 500 });
    }

    // Dynamic Row Finder
    let maleRow = 5; // Default fallback
    for(let r = 1; r < 20; r++) {
        const val = String(sheet.getCell(`B${r}`).value).toUpperCase();
        if(val.includes("MALE")) {
            maleRow = r + 1;
            break;
        }
    }

    let currentRow = maleRow;
    const males = students.filter((s: any) => s.sex === 'M');
    males.forEach((student: any) => {
        sheet.getCell(`B${currentRow}`).value = student.name;
        sheet.getCell(`O${currentRow}`).value = student.average > 0 ? student.average : ""; 
        currentRow++;
    });

    let femaleStartRow = 30;
    for(let r = currentRow; r < 80; r++) {
        if(String(sheet.getCell(`B${r}`).value).toUpperCase().includes("FEMALE")) {
            femaleStartRow = r + 1;
            break;
        }
    }
    
    currentRow = femaleStartRow;
    const females = students.filter((s: any) => s.sex === 'F');
    females.forEach((student: any) => {
        sheet.getCell(`B${currentRow}`).value = student.name;
        sheet.getCell(`O${currentRow}`).value = student.average > 0 ? student.average : ""; 
        currentRow++;
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
       status: 200,
       headers: {
           'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
           'Content-Disposition': `attachment; filename="Composite_Grades_Export.xlsx"`
       }
    });

  } catch (error: any) {
    console.error("Composite Export Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to export' }, { status: 500 });
  }
}
