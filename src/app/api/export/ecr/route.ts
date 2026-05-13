import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs/promises';
import { generateToken, validateToken } from '@/lib/csrf';
import { checkRateLimit, cleanupRateLimits } from '@/lib/rateLimit';

// ─── GET handler (CSRF token provisioning) ──────────────────────────────────────
export async function GET() {
  const token = generateToken()
  const resp = NextResponse.json({ csrfToken: token })
  resp.cookies.set('csrf-token', token, {
    path: '/',
    sameSite: 'strict',
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 3600,
  })
  return resp
}

export async function POST(req: NextRequest) {
  try {
    // ── Rate Limiting ───────────────────────────────────────────────────────
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || '127.0.0.1'
    cleanupRateLimits()
    if (!checkRateLimit(ip, 'export/ecr')) {
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

    const { subject, students, schoolInfo } = await req.json();

    // Dynamic template selection: try subject+grade+section, fall back to hardcoded default
    const grade = schoolInfo?.gradeLevel || '8';
    const section = schoolInfo?.section || 'ARIES';
    const candidateName = `${subject} ${grade} ${section} ECR.xlsx`;
    const candidatePath = path.join(process.cwd(), 'public', 'templates', candidateName);
    const fallbackName = 'FIL 8 ARIES ECR.xlsx';
    const fallbackPath = path.join(process.cwd(), 'public', 'templates', fallbackName);

    let templateName: string;
    let templatePath: string;

    try {
        await fs.access(candidatePath);
        templateName = candidateName;
        templatePath = candidatePath;
    } catch {
        try {
            await fs.access(fallbackPath);
            templateName = fallbackName;
            templatePath = fallbackPath;
        } catch {
            return NextResponse.json({ error: `Template not found: tried "${candidateName}" and "${fallbackName}"` }, { status: 404 });
        }
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
