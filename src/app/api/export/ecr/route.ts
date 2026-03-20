import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs/promises';

export async function POST(req: Request) {
  try {
    const { subject, students, schoolInfo } = await req.json();

    // In a full production mapping, we would dynamically select the template based on subject/grade.
    // For this prototype, we use the FIL 8 ARIES ECR template as the unified format.
    const templateName = 'FIL 8 ARIES ECR.xlsx';
    const templatePath = path.join(process.cwd(), 'public', 'templates', templateName);

    // Verify template existence
    try {
        await fs.access(templatePath);
    } catch {
       return NextResponse.json({ error: `Template ${templateName} not found in public/templates/` }, { status: 404 });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);

    // Get the First Quarter Sheet
    const sheet = workbook.getWorksheet('FIL_Q1') || workbook.worksheets[1];
    if (!sheet) {
        return NextResponse.json({ error: 'Could not find Quarter 1 Worksheet in template.' }, { status: 500 });
    }

    // Dynamic Row Finder to stop MALE header overwrites and off-by-1 shifts
    let maleRow = 12;
    for(let r = 5; r < 20; r++) {
        const val = String(sheet.getCell(`B${r}`).value).toUpperCase();
        if (val.trim() === "MALE" || val.includes("MALE")) {
            maleRow = r + 1;
            break;
        }
    }
    
    let currentRow = maleRow;
    
    // Inject Male
    const males = students.filter((s: any) => s.sex === 'M');
    males.forEach((student: any) => {
        sheet.getCell(`B${currentRow}`).value = student.name; 
        
        // Blank cells instead of 0s to preserve pristine spreadsheet look
        sheet.getCell(`F${currentRow}`).value = student.scores.ww_0 || ""; 
        sheet.getCell(`G${currentRow}`).value = student.scores.ww_1 || ""; 
        sheet.getCell(`T${currentRow}`).value = student.scores.pt_0 || ""; 
        sheet.getCell(`U${currentRow}`).value = student.scores.pt_1 || ""; 
        sheet.getCell(`AH${currentRow}`).value = student.scores.qa || ""; 

        currentRow++;
    });

    // Jump to Female starting row (Usually row 35 or 36)
    // We dynamically find it by searching column B for "FEMALE"
    let femaleStartRow = 36;
    for(let r = 11; r < 60; r++) {
        if(String(sheet.getCell(`B${r}`).value).toUpperCase().includes("FEMALE")) {
            femaleStartRow = r + 1;
            break;
        }
    }
    
    currentRow = femaleStartRow;
    const females = students.filter((s: any) => s.sex === 'F');
    females.forEach((student: any) => {
        sheet.getCell(`B${currentRow}`).value = student.name;
        
        sheet.getCell(`F${currentRow}`).value = student.scores.ww_0 || ""; 
        sheet.getCell(`G${currentRow}`).value = student.scores.ww_1 || ""; 
        sheet.getCell(`T${currentRow}`).value = student.scores.pt_0 || ""; 
        sheet.getCell(`U${currentRow}`).value = student.scores.pt_1 || ""; 
        sheet.getCell(`AH${currentRow}`).value = student.scores.qa || ""; 
        
        currentRow++;
    });

    // Generate output buffer
    const buffer = await workbook.xlsx.writeBuffer();

    const sanitizedName = (schoolInfo?.section || 'Class').replace(/\s/g, '_');
    return new NextResponse(buffer, {
       status: 200,
       headers: {
           'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
           'Content-Disposition': `attachment; filename="Generated_ECR_${subject}_Q1_${sanitizedName}.xlsx"`
       }
    });

  } catch (error: any) {
    console.error("ECR Export Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to export ECR' }, { status: 500 });
  }
}
