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
          content: "You are a specialized OCR AI that extracts student data from ANY document (Philippine DepEd Form 138 report cards, class lists, directories, birth certificates). You must detect as many students as are clearly visible. You must respond in STRICT JSON format matching this schema: { students: [ { lrn: string (12 digits, fallback to a random 12 digit number if none visible), firstName: string, middleName: string (Optional, omit if none), lastName: string, suffix: string (Optional, Jr, III, etc), sex: 'M' | 'F' (Extrapolate from name or picture if blank) } ] }. Only return the perfectly structured JSON object."
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Scan this document and intelligently extract ALL learner details present." },
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
