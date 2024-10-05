import { NextRequest, NextResponse } from 'next/server'
import { readFile, writeFile } from 'fs/promises'
import path from 'path'
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import { v4 as uuidv4 } from 'uuid'
import JSZip from 'jszip'
import ImageModule from 'docxtemplater-image-module-free'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const id = formData.get('id') as string
  const practicalDataJson = formData.get('practicalData') as string
  const fieldTypesJson = formData.get('fieldTypes') as string

  const practicalData = JSON.parse(practicalDataJson)
  const fieldTypes = JSON.parse(fieldTypesJson)

  const templatePath = path.join(process.cwd(), 'uploads', `${id}.docx`)
  const mappingsPath = path.join(process.cwd(), 'mappings', `${id}.json`)

  try {
    const templateContent = await readFile(templatePath)
    const mappingsContent = await readFile(mappingsPath, 'utf-8')
    const mappings = JSON.parse(mappingsContent)

    const documents = await Promise.all(practicalData.map(async (practical: any, index: number) => {
      const zip = new PizZip(templateContent)

      const imageModule = new ImageModule({
        centered: false,
        getImage: async (tagValue: string) => {
          const imageFile = formData.get(tagValue) as File
          if (imageFile) {
            const arrayBuffer = await imageFile.arrayBuffer()
            return arrayBuffer
          }
          return null
        },
        getSize: () => [150, 150],
      })

      const doc = new Docxtemplater(zip, { 
        paragraphLoop: true, 
        linebreaks: true,
        delimiters: {
          start: '{{',
          end: '}}',
        },
        modules: [imageModule],
      })

      const data: Record<string, any> = {}

      for (const [placeholder, field] of Object.entries(mappings)) {
        if (fieldTypes[field].isCode) {
          data[placeholder.replace(/[{}]/g, '')] = formatCodeForWord(practical[field] || '')
        } else if (fieldTypes[field].isImage) {
          data[placeholder.replace(/[{}]/g, '')] = `image_${index}_${field}`
        } else {
          data[placeholder.replace(/[{}]/g, '')] = practical[field] || ''
        }
      }

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

function formatCodeForWord(code: string): string {
  const lines = code.split('\n')
  return lines.join('\n')
}

async function combineDocuments(documents: Buffer[]): Promise<Buffer> {
  const zip = new JSZip()
  await zip.loadAsync(documents[0])

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

    // Copy media files from each document
    const mediaFiles = await docZip.folder('word/media')?.files()
    if (mediaFiles) {
      for (const [filename, file] of Object.entries(mediaFiles)) {
        const content = await file.async('nodebuffer')
        zip.file(`word/media/${filename}`, content)
      }
    }
  }

  return zip.generateAsync({ type: 'nodebuffer' })
}

function mergeDocumentXml(baseXml: string, newXml: string): string {
  const bodyRegex = /<w:body>([\s\S]*)<\/w:body>/
  const baseBody = baseXml.match(bodyRegex)?.[1] || ''
  const newBody = newXml.match(bodyRegex)?.[1] || ''
  const pageBreak = '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'
  return baseXml.replace(bodyRegex, `<w:body>${baseBody}${pageBreak}${newBody}</w:body>`)
}