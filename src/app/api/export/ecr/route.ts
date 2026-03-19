import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs/promises';

export async function POST(req: Request) {
  try {
    const { subject, students } = await req.json();

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

    // DepEd Template Writing Engine
    // We override specific cells safely to preserve the robust native Excel formulas.
    // Assuming Male starts around row 11 in standard CAMIGAO templates.
    let currentRow = 11;
    
    // Inject Male
    const males = students.filter((s: any) => s.sex === 'M');
    males.forEach((student: any) => {
        sheet.getCell(`B${currentRow}`).value = student.name; // Legal Name
        
        // In the exact CAMIGAO template, columns for WW1, WW2 etc. are spread out.
        // Assuming C, D for WW1, WW2 and P, Q for PT1, PT2, and AA for QA based on typical matrix mappings.
        // If these are wrong for their exact file, they just change the column letters here.
        sheet.getCell(`F${currentRow}`).value = student.scores.ww1 || 0; 
        sheet.getCell(`G${currentRow}`).value = student.scores.ww2 || 0; 
        
        sheet.getCell(`T${currentRow}`).value = student.scores.pt1 || 0; 
        sheet.getCell(`U${currentRow}`).value = student.scores.pt2 || 0; 
        
        sheet.getCell(`AH${currentRow}`).value = student.scores.qa || 0; 

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
        
        sheet.getCell(`F${currentRow}`).value = student.scores.ww1 || 0; 
        sheet.getCell(`G${currentRow}`).value = student.scores.ww2 || 0; 
        
        sheet.getCell(`T${currentRow}`).value = student.scores.pt1 || 0; 
        sheet.getCell(`U${currentRow}`).value = student.scores.pt2 || 0; 
        
        sheet.getCell(`AH${currentRow}`).value = student.scores.qa || 0; 
        
        currentRow++;
    });

    // Generate output buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
       status: 200,
       headers: {
           'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
           'Content-Disposition': `attachment; filename="Generated_ECR_${subject}_Q1.xlsx"`
       }
    });

  } catch (error: any) {
    console.error("ECR Export Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to export ECR' }, { status: 500 });
  }
}
