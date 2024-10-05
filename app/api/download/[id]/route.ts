import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const filePath = path.join(process.cwd(), 'output', `${params.id}.docx`)

  try {
    const file = await readFile(filePath)
    return new NextResponse(file, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="generated_document.docx"`,
      },
    })
  } catch (error) {
    console.error('Error reading file:', error)
    return NextResponse.json({ error: 'Error reading file' }, { status: 500 })
  }
}