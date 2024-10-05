import { NextRequest, NextResponse } from 'next/server'
import { readFile, writeFile } from 'fs/promises'
import path from 'path'
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import { v4 as uuidv4 } from 'uuid'
import JSZip from 'jszip'

export async function POST(request: NextRequest) {
  const { id, practicalData } = await request.json()

  const templatePath = path.join(process.cwd(), 'uploads', `${id}.docx`)
  const mappingsPath = path.join(process.cwd(), 'mappings', `${id}.json`)

  try {
    const templateContent = await readFile(templatePath)
    const mappingsContent = await readFile(mappingsPath, 'utf-8')
    const mappings = JSON.parse(mappingsContent)

    const documents = await Promise.all(practicalData.map(async (practical: any, index: number) => {
      const zip = new PizZip(templateContent)
      const doc = new Docxtemplater(zip, { 
        paragraphLoop: true, 
        linebreaks: true,
        delimiters: {
          start: '{{',
          end: '}}',
        },
      })

      const data = Object.entries(mappings).reduce((acc, [placeholder, field]) => {
        acc[placeholder.replace(/[{}]/g, '')] = practical[field] || ''
        return acc
      }, {} as Record<string, string>)

      data['practical_number'] = `Practical-${index + 1}`

      try {
        doc.setData(data)
        await doc.render()
        return doc.getZip().generate({ type: 'nodebuffer' })
      } catch (error: any) {
        if (error.properties && error.properties.errors) {
          const errorMessages = error.properties.errors.map((e: any) => e.properties.explanation).join(', ')
          throw new Error(`Error in Practical ${index + 1}: ${errorMessages}`)
        }
        throw error
      }
    }))

    const mergedDoc = await combineDocuments(documents)

    const fileId = uuidv4()
    const outputPath = path.join(process.cwd(), 'output', `${fileId}.docx`)
    await writeFile(outputPath, mergedDoc)

    return NextResponse.json({ fileId }, { status: 200 })
  } catch (error: any) {
    console.error('Error generating document:', error)
    return NextResponse.json({ error: error.message || 'Error generating document' }, { status: 500 })
  }
}

async function combineDocuments(documents: Buffer[]): Promise<Buffer> {
  const zip = new JSZip()

  // Load the first document as the base
  await zip.loadAsync(documents[0])

  // Merge the content of subsequent documents
  for (let i = 1; i < documents.length; i++) {
    const docZip = await JSZip.loadAsync(documents[i])
    const contentXml = await docZip.file('word/document.xml')?.async('string')
    if (contentXml) {
      const baseContentXml = await zip.file('word/document.xml')?.async('string')
      if (baseContentXml) {
        const newContent = mergeDocumentXml(baseContentXml, contentXml)
        zip.file('word/document.xml', newContent)
      }
    }
  }

  // Generate the final document
  return zip.generateAsync({ type: 'nodebuffer' })
}

function mergeDocumentXml(baseXml: string, newXml: string): string {
  const bodyRegex = /<w:body>([\s\S]*)<\/w:body>/
  const baseBody = baseXml.match(bodyRegex)?.[1] || ''
  const newBody = newXml.match(bodyRegex)?.[1] || ''

  // Remove the last paragraph (usually a section break) from the base document
  const trimmedBaseBody = baseBody.replace(/<w:p[^>]*>(?:(?!<w:p)[\s\S])*<\/w:p>$/, '')

  // Add a page break before the new content
  const pageBreak = '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'

  return baseXml.replace(bodyRegex, `<w:body>${trimmedBaseBody}${pageBreak}${newBody}</w:body>`)
}