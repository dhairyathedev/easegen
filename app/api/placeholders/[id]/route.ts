import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import mammoth from 'mammoth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const filePath = path.join(process.cwd(), 'uploads', `${params.id}.docx`)

  try {
    const buffer = await readFile(filePath)
    const result = await mammoth.extractRawText({ buffer })
    const text = result.value

    // Simple regex to find placeholders. Adjust as needed.
    const placeholderRegex = /{{([^}]+)}}/g
    const placeholders = [...new Set(text.match(placeholderRegex) || [])]

    return NextResponse.json({ placeholders }, { status: 200 })
  } catch (error) {
    console.error('Error reading file:', error)
    return NextResponse.json({ error: 'Error reading file' }, { status: 500 })
  }
}