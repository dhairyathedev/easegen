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

  // Ensure all necessary parts are included
  await ensureAllPartsIncluded(baseZip);

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
<w:document 
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" 
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
  xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml"
  xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
  mc:Ignorable="w14 w15 wp14">
  <w:body>
    ${bodyContent}
    <w:sectPr>
      ${headerRefsXml}
      ${footerRefsXml}
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
      <w:cols w:space="720"/>
      <w:docGrid w:linePitch="360"/>
    </w:sectPr>
  </w:body>
</w:document>`;
}

async function ensureAllPartsIncluded(zip: JSZip) {
  const requiredParts = [
    '[Content_Types].xml',
    '_rels/.rels',
    'word/_rels/document.xml.rels',
    'word/styles.xml',
    'word/settings.xml',
    'word/webSettings.xml',
    'word/fontTable.xml',
    'word/theme/theme1.xml'
  ];

  for (const part of requiredParts) {
    if (!zip.file(part)) {
      // If the part is missing, add a default version
      const defaultContent = await getDefaultContent(part);
      zip.file(part, defaultContent);
    }
  }
}

async function getDefaultContent(partName: string): Promise<string> {
  // Provide default content for each required part
  switch (partName) {
    case '[Content_Types].xml':
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
  <Override PartName="/word/webSettings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.webSettings+xml"/>
  <Override PartName="/word/fontTable.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml"/>
  <Override PartName="/word/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
</Types>`;
    case '_rels/.rels':
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
    case 'word/_rels/document.xml.rels':
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/webSettings" Target="webSettings.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/>
  <Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
</Relationships>`;
    case 'word/styles.xml':
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:asciiTheme="minorHAnsi" w:eastAsiaTheme="minorEastAsia" w:hAnsiTheme="minorHAnsi" w:cstheme="minorBidi"/>
        <w:sz w:val="22"/>
        <w:szCs w:val="22"/>
        <w:lang w:val="en-US" w:eastAsia="en-US" w:bidi="ar-SA"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:after="200" w:line="276" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
  </w:style>
</w:styles>`;
    case 'word/settings.xml':
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:zoom w:percent="100"/>
  <w:defaultTabStop w:val="720"/>
  <w:characterSpacingControl w:val="doNotCompress"/>
</w:settings>`;
    case 'word/webSettings.xml':
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:webSettings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:optimizeForBrowser/>
</w:webSettings>`;
    case 'word/fontTable.xml':
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:fonts xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:font w:name="Calibri">
    <w:panose1 w:val="020F0502020204030204"/>
    <w:charset w:val="00"/>
    <w:family w:val="swiss"/>
    <w:pitch w:val="variable"/>
    <w:sig w:usb0="E0002AFF" w:usb1="C000247B" w:usb2="00000009" w:usb3="00000000" w:csb0="000001FF" w:csb1="00000000"/>
  </w:font>
</w:fonts>`;
    case 'word/theme/theme1.xml':
      return `<?xml version="1.0" 
encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office Theme">
  <a:themeElements>
    <a:clrScheme name="Office">
      <a:dk1>
        <a:sysClr val="windowText" lastClr="000000"/>
      </a:dk1>
      <a:lt1>
        <a:sysClr val="window" lastClr="FFFFFF"/>
      </a:lt1>
      <a:dk2>
        <a:srgbClr val="44546A"/>
      </a:dk2>
      <a:lt2>
        <a:srgbClr val="E7E6E6"/>
      </a:lt2>
      <a:accent1>
        <a:srgbClr val="4472C4"/>
      </a:accent1>
      <a:accent2>
        <a:srgbClr val="ED7D31"/>
      </a:accent2>
      <a:accent3>
        <a:srgbClr val="A5A5A5"/>
      </a:accent3>
      <a:accent4>
        <a:srgbClr val="FFC000"/>
      </a:accent4>
      <a:accent5>
        <a:srgbClr val="5B9BD5"/>
      </a:accent5>
      <a:accent6>
        <a:srgbClr val="70AD47"/>
      </a:accent6>
      <a:hlink>
        <a:srgbClr val="0563C1"/>
      </a:hlink>
      <a:folHlink>
        <a:srgbClr val="954F72"/>
      </a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="Office">
      <a:majorFont>
        <a:latin typeface="Calibri Light" panose="020F0302020204030204"/>
        <a:ea typeface=""/>
        <a:cs typeface=""/>
      </a:majorFont>
      <a:minorFont>
        <a:latin typeface="Calibri" panose="020F0502020204030204"/>
        <a:ea typeface=""/>
        <a:cs typeface=""/>
      </a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="Office">
      <a:fillStyleLst>
        <a:solidFill>
          <a:schemeClr val="phClr"/>
        </a:solidFill>
        <a:gradFill rotWithShape="1">
          <a:gsLst>
            <a:gs pos="0">
              <a:schemeClr val="phClr">
                <a:lumMod val="110000"/>
                <a:satMod val="105000"/>
                <a:tint val="67000"/>
              </a:schemeClr>
            </a:gs>
            <a:gs pos="50000">
              <a:schemeClr val="phClr">
                <a:lumMod val="105000"/>
                <a:satMod val="103000"/>
                <a:tint val="73000"/>
              </a:schemeClr>
            </a:gs>
            <a:gs pos="100000">
              <a:schemeClr val="phClr">
                <a:lumMod val="105000"/>
                <a:satMod val="109000"/>
                <a:tint val="81000"/>
              </a:schemeClr>
            </a:gs>
          </a:gsLst>
          <a:lin ang="5400000" scaled="0"/>
        </a:gradFill>
        <a:gradFill rotWithShape="1">
          <a:gsLst>
            <a:gs pos="0">
              <a:schemeClr val="phClr">
                <a:satMod val="103000"/>
                <a:lumMod val="102000"/>
                <a:tint val="94000"/>
              </a:schemeClr>
            </a:gs>
            <a:gs pos="50000">
              <a:schemeClr val="phClr">
                <a:satMod val="110000"/>
                <a:lumMod val="100000"/>
                <a:shade val="100000"/>
              </a:schemeClr>
            </a:gs>
            <a:gs pos="100000">
              <a:schemeClr val="phClr">
                <a:lumMod val="99000"/>
                <a:satMod val="120000"/>
                <a:shade val="78000"/>
              </a:schemeClr>
            </a:gs>
          </a:gsLst>
          <a:lin ang="5400000" scaled="0"/>
        </a:gradFill>
      </a:fillStyleLst>
      <a:lnStyleLst>
        <a:ln w="6350" cap="flat" cmpd="sng" algn="ctr">
          <a:solidFill>
            <a:schemeClr val="phClr"/>
          </a:solidFill>
          <a:prstDash val="solid"/>
          <a:miter lim="800000"/>
        </a:ln>
        <a:ln w="12700" cap="flat" cmpd="sng" algn="ctr">
          <a:solidFill>
            <a:schemeClr val="phClr"/>
          </a:solidFill>
          <a:prstDash val="solid"/>
          <a:miter lim="800000"/>
        </a:ln>
        <a:ln w="19050" cap="flat" cmpd="sng" algn="ctr">
          <a:solidFill>
            <a:schemeClr val="phClr"/>
          </a:solidFill>
          <a:prstDash val="solid"/>
          <a:miter lim="800000"/>
        </a:ln>
      </a:lnStyleLst>
      <a:effectStyleLst>
        <a:effectStyle>
          <a:effectLst/>
        </a:effectStyle>
        <a:effectStyle>
          <a:effectLst/>
        </a:effectStyle>
        <a:effectStyle>
          <a:effectLst>
            <a:outerShdw blurRad="57150" dist="19050" dir="5400000" algn="ctr" rotWithShape="0">
              <a:srgbClr val="000000">
                <a:alpha val="63000"/>
              </a:srgbClr>
            </a:outerShdw>
          </a:effectLst>
        </a:effectStyle>
      </a:effectStyleLst>
      <a:bgFillStyleLst>
        <a:solidFill>
          <a:schemeClr val="phClr"/>
        </a:solidFill>
        <a:solidFill>
          <a:schemeClr val="phClr">
            <a:tint val="95000"/>
            <a:satMod val="170000"/>
          </a:schemeClr>
        </a:solidFill>
        <a:gradFill rotWithShape="1">
          <a:gsLst>
            <a:gs pos="0">
              <a:schemeClr val="phClr">
                <a:tint val="93000"/>
                <a:satMod val="150000"/>
                <a:shade val="98000"/>
                <a:lumMod val="102000"/>
              </a:schemeClr>
            </a:gs>
            <a:gs pos="50000">
              <a:schemeClr val="phClr">
                <a:tint val="98000"/>
                <a:satMod val="130000"/>
                <a:shade val="90000"/>
                <a:lumMod val="103000"/>
              </a:schemeClr>
            </a:gs>
            <a:gs pos="100000">
              <a:schemeClr val="phClr">
                <a:shade val="63000"/>
                <a:satMod val="120000"/>
              </a:schemeClr>
            </a:gs>
          </a:gsLst>
          <a:lin ang="5400000" scaled="0"/>
        </a:gradFill>
      </a:bgFillStyleLst>
    </a:fmtScheme>
  </a:themeElements>
</a:theme>`;
    default:
      return '';
  }
}

function formatCodeForWord(code: string): string {
  return code.split('\n').join('\n');
}