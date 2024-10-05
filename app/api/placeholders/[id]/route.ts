import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import mammoth from 'mammoth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const filePath = path.join(process.cwd(), 'uploads', `${params.id}.docx`);

  try {
    // Read the .docx file as buffer
    const buffer = await readFile(filePath);

    // Extract raw text using Mammoth
    const result = await mammoth.extractRawText({ buffer: buffer as Buffer });
    const text = result.value;

    // Simple regex to find placeholders like {{placeholder}}
    const placeholderRegex = /{{([^}]+)}}/g;
    const placeholdersSet = new Set(text.match(placeholderRegex) || []);

    // Convert Set to Array for safe iteration
    const placeholders = Array.from(placeholdersSet);

    // Return the list of unique placeholders
    return NextResponse.json({ placeholders }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error reading file:', error);
    return NextResponse.json({ error: 'Error reading file' }, { status: 500 });
  }
}
