import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { base64Image } = await req.json();

    if (!base64Image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({ error: 'Missing OpenAI API Key in server configuration.'}, { status: 500 });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a specialized OCR AI that extracts student grades from ANY document (class records, grading sheets, Form 138). You must detect student names and their corresponding grades. You must respond in STRICT JSON format matching this schema: { grades: [ { name: string, subject: string (Optional, infer if possible), quarterGrade: number (e.g. 85, 90) } ] }. Only return the perfectly structured JSON object."
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Scan this document and intelligently extract ALL learner grades present." },
            {
              type: "image_url",
              image_url: {
                url: base64Image,
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1500,
    });

    const content = response.choices[0].message.content;
    if (!content) {
        throw new Error("No content returned from OpenAI")
    }
    
    const parsedData = JSON.parse(content);
    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error("OpenAI Extraction Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to process document' }, { status: 500 });
  }
}
