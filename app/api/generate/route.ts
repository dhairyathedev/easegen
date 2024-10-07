/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { readFile, writeFile } from 'fs/promises'
import path from 'path'
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import { v4 as uuidv4 } from 'uuid'
import JSZip from 'jszip'

interface FieldType {
  isCode: boolean;
  isImage: boolean;
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const id = formData.get("id") as string;
  const practicalDataJson = formData.get("practicalData") as string;
  const fieldTypesJson = formData.get("fieldTypes") as string;

  const practicalData = JSON.parse(practicalDataJson);
  const fieldTypes: Record<string, FieldType> = JSON.parse(fieldTypesJson);

  const templatePath = path.join(process.cwd(), "uploads", `${id}.docx`);
  const mappingsPath = path.join(process.cwd(), "mappings", `${id}.json`);

  try {
    const templateContent = await readFile(templatePath);
    const mappingsContent = await readFile(mappingsPath, "utf-8");
    const mappings: Record<string, string> = JSON.parse(mappingsContent);

    const documents = await Promise.all(
      practicalData.map(async (practical: any, index: number) => {
        const zip = new PizZip(templateContent);
        const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
          delimiters: {
            start: "{{",
            end: "}}",
          },
        });

        const data: Record<string, any> = {};
        for (const [placeholder, field] of Object.entries(mappings)) {
          if (fieldTypes[field].isCode) {
            data[placeholder.replace(/[{}]/g, "")] = formatCodeForWord(
              practical[field] || ""
            );
          } else if (fieldTypes[field].isImage) {
            data[placeholder.replace(/[{}]/g, "")] = `image_${index}_${field}`;
          } else {
            data[placeholder.replace(/[{}]/g, "")] = practical[field] || "";
          }
        }

        data["practical_number"] = `Practical-${index + 1}`;

        try {
          doc.setData(data);
          await doc.render();
          return doc.getZip().generate({ type: "nodebuffer" });
        } catch (error: any) {
          if (error.properties && error.properties.errors) {
            const errorMessages = error.properties.errors
              .map((e: any) => e.properties.explanation)
              .join(", ");
            throw new Error(`Error in Practical ${index + 1}: ${errorMessages}`);
          }
          throw error;
        }
      })
    );

    const mergedDoc = await combineDocumentsWithHeaders(documents);

    const fileId = uuidv4();
    const outputPath = path.join(process.cwd(), "output", `${fileId}.docx`);
    await writeFile(outputPath, mergedDoc);

    return NextResponse.json({ fileId }, { status: 200 });
  } catch (error: any) {
    console.error("Error generating document:", error);
    return NextResponse.json(
      { error: error.message || "Error generating document" },
      { status: 500 }
    );
  }
}

async function combineDocumentsWithHeaders(documents: Buffer[]): Promise<Buffer> {
  const baseZip = new JSZip();
  await baseZip.loadAsync(documents[0]);

  // Store the header and footer content from the first document
  const headerRefs: string[] = [];
  const footerRefs: string[] = [];
  const headerContents = new Map<string, string>();
  const footerContents = new Map<string, string>();

  // Extract header and footer references from the first document
  const baseDocumentXml = await baseZip.file('word/document.xml')?.async('string');
  if (baseDocumentXml) {
    const headerMatches = baseDocumentXml.match(/<w:headerReference r:id=".*?" w:type=".*?"\/>/g) || [];
    const footerMatches = baseDocumentXml.match(/<w:footerReference r:id=".*?" w:type=".*?"\/>/g) || [];
    
    headerRefs.push(...headerMatches);
    footerRefs.push(...footerMatches);

    // Store header and footer contents
    for (const file of Object.values(baseZip.files)) {
      if (file.name.startsWith('word/header')) {
        const content = await file.async('string');
        headerContents.set(file.name, content);
      } else if (file.name.startsWith('word/footer')) {
        const content = await file.async('string');
        footerContents.set(file.name, content);
      }
    }
  }

  // Combine document content
  let combinedBody = '';
  for (let i = 0; i < documents.length; i++) {
    const docZip = new JSZip();
    await docZip.loadAsync(documents[i]);
    const contentXml = await docZip.file('word/document.xml')?.async('string');
    
    if (contentXml) {
      const bodyContent = extractBodyContent(contentXml);
      if (i > 0) {
        combinedBody += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
      }
      combinedBody += bodyContent;
    }
  }

  // Create new document XML with combined content and original headers/footers
  const newDocumentXml = createNewDocumentXml(combinedBody, headerRefs, footerRefs);
  baseZip.file('word/document.xml', newDocumentXml);

  return baseZip.generateAsync({ type: 'nodebuffer' });
}

function extractBodyContent(xml: string): string {
  const bodyRegex = /<w:body>([\s\S]*)<\/w:body>/;
  const bodyMatch = xml.match(bodyRegex);
  if (bodyMatch && bodyMatch[1]) {
    // Remove any existing section properties
    return bodyMatch[1].replace(/<w:sectPr>[\s\S]*<\/w:sectPr>/, '');
  }
  return '';
}

function createNewDocumentXml(bodyContent: string, headerRefs: string[], footerRefs: string[]): string {
  const headerRefsXml = headerRefs.join('');
  const footerRefsXml = footerRefs.join('');
  
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${bodyContent}
    <w:sectPr>
      ${headerRefsXml}
      ${footerRefsXml}
    </w:sectPr>
  </w:body>
</w:document>`;
}

function formatCodeForWord(code: string): string {
  return code.split('\n').join('\n');
}