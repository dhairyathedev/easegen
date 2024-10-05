/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readFile } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const id = uuidv4()
  const filePath = path.join(process.cwd(), 'uploads', `${id}.docx`)

  try {
    await writeFile(filePath, buffer)
    
    // Validate the template
    const templateContent = await readFile(filePath)
    const zip = new PizZip(templateContent)
    new Docxtemplater(zip, { 
      paragraphLoop: true, 
      linebreaks: true,
      delimiters: {
        start: '{{',
        end: '}}',
      },
    })

    return NextResponse.json({ id }, { status: 200 })
  } catch (error: any) {
    console.error('Error saving or validating file:', error)
    if (error.properties && error.properties.errors) {
      const errorMessages = error.properties.errors.map((e: any) => e.properties.explanation).join(', ')
      return NextResponse.json({ error: `Template validation failed: ${errorMessages}` }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error saving or validating file' }, { status: 500 })
  }
}