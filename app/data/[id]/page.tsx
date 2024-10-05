'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const CodeEditor = dynamic(
  () => import('@uiw/react-textarea-code-editor').then((mod) => mod.default),
  { ssr: false }
)

interface FieldType {
  name: string;
  isCode: boolean;
  isImage: boolean;
  isAim: boolean;
  defaultLanguage?: string;
}

export default function DataEntry({ params }: { params: { id: string } }) {
  const [mappings, setMappings] = useState<Record<string, string>>({})
  const [fieldTypes, setFieldTypes] = useState<Record<string, FieldType>>({})
  const [practicalCount, setPracticalCount] = useState(1)
  const [practicalData, setPracticalData] = useState<Record<string, string | File>[]>([{}])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch(`/api/mappings/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setMappings(data.mappings)
        const initialFieldTypes: Record<string, FieldType> = {}
        Object.values(data.mappings).forEach(field => {
          initialFieldTypes[field] = { 
            name: field, 
            isCode: false, 
            isImage: false,
            isAim: false,
          }
        })
        setFieldTypes(initialFieldTypes)
      })
      .catch(err => setError('Failed to load mappings'))
  }, [params.id])

  const handlePracticalCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = parseInt(e.target.value)
    setPracticalCount(count)
    setPracticalData(prev => {
      const newData = [...prev]
      while (newData.length < count) {
        newData.push({})
      }
      return newData.slice(0, count)
    })
  }

  const handleDataChange = (practicalIndex: number, field: string, value: string | File) => {
    setPracticalData(prev => {
      const newData = [...prev]
      newData[practicalIndex] = { ...newData[practicalIndex], [field]: value }
      return newData
    })
  }

  const handleFieldTypeChange = (field: string, type: 'isCode' | 'isImage' | 'isAim') => {
    setFieldTypes(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [type]: !prev[field][type],
        ...(type === 'isCode' ? { isImage: false, isAim: false } : 
           type === 'isImage' ? { isCode: false, isAim: false } :
           { isCode: false, isImage: false })
      }
    }))
  }

  const handleDefaultLanguageChange = (field: string, language: string) => {
    setFieldTypes(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        defaultLanguage: language
      }
    }))
  }

  const handleGenerateCode = async (practicalIndex: number) => {
    // Find field names for title, aim, and code
    const aimField = Object.entries(fieldTypes).find(([_, type]) => type.isAim)?.[0]
    const codeField = Object.entries(fieldTypes).find(([_, type]) => type.isCode)?.[0]
    
    const aim = aimField ? (practicalData[practicalIndex]?.[aimField] as string) : undefined
    const language = codeField ? fieldTypes[codeField].defaultLanguage : undefined


    if (!language) {
      setError('Please select a programming language to generate code.')
      return
    }

    if (!codeField) {
      setError('Please mark a field as Code to generate code.')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/generate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ aim, language }),
      })

      const data = await response.json()

      if (response.ok) {
        handleDataChange(practicalIndex, codeField, data.code)
      } else {
        setError(data.error || 'Code generation failed')
      }
    } catch (error) {
      console.error('Error:', error)
      setError('An unexpected error occurred during code generation')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    setError(null)

    const formData = new FormData()
    formData.append('id', params.id)
    formData.append('practicalData', JSON.stringify(practicalData))
    formData.append('fieldTypes', JSON.stringify(fieldTypes))

    practicalData.forEach((practical, index) => {
      Object.entries(practical).forEach(([field, value]) => {
        if (value instanceof File) {
          formData.append(`image_${index}_${field}`, value)
        }
      })
    })

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        router.push(`/preview/${data.fileId}`)
      } else {
        setError(data.error || 'Generation failed')
      }
    } catch (error) {
      console.error('Error:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold mb-4">Enter Practical Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label htmlFor="practicalCount">Number of Practicals</Label>
            <Input
              id="practicalCount"
              type="number"
              min="1"
              value={practicalCount}
              onChange={handlePracticalCountChange}
            />
          </div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Field Types</h3>
            {Object.entries(fieldTypes).map(([field, type]) => (
              <div key={field} className="flex items-center space-x-2 mb-2">
                <Label className="w-24">{field}</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field}-code`}
                    checked={type.isCode}
                    onCheckedChange={() => handleFieldTypeChange(field, 'isCode')}
                  />
                  <Label htmlFor={`${field}-code`}>Code</Label>
                  {type.isCode && (
                    <Select
                      value={type.defaultLanguage}
                      onValueChange={(value) => handleDefaultLanguageChange(field, value)}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="python">Python</SelectItem>
                        <SelectItem value="javascript">JavaScript</SelectItem>
                        <SelectItem value="java">Java</SelectItem>
                        <SelectItem value="cpp">C++</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field}-image`}
                    checked={type.isImage}
                    onCheckedChange={() => handleFieldTypeChange(field, 'isImage')}
                  />
                  <Label htmlFor={`${field}-image`}>Image</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field}-aim`}
                    checked={type.isAim}
                    onCheckedChange={() => handleFieldTypeChange(field, 'isAim')}
                  />
                  <Label htmlFor={`${field}-aim`}>Aim</Label>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {Array.from({ length: practicalCount }).map((_, index) => (
              <Card key={index} className="p-4">
                <CardTitle className="text-xl font-bold mb-4">Practical {index + 1}</CardTitle>
                <div className="space-y-4">
                  {Object.entries(mappings).map(([placeholder, field]) => (
                    <div key={field}>
                      <Label htmlFor={`${field}-${index}`}>{field}</Label>
                      {fieldTypes[field]?.isCode ? (
                        <div>
                          <CodeEditor
                            value={practicalData[index]?.[field] as string || ''}
                            language={fieldTypes[field].defaultLanguage || 'cpp'}
                            placeholder="Enter your code here"
                            onChange={(evn) => handleDataChange(index, field, evn.target.value)}
                            padding={15}
                            style={{
                              fontSize: 12,
                              backgroundColor: "#000000",
                              fontFamily: 'ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
                            }}
                          />
                          <Button
                            type="button"
                            onClick={() => handleGenerateCode(index)}
                            className="mt-2"
                            disabled={isGenerating}
                          >
                            Generate Code
                          </Button>
                        </div>
                      ) : fieldTypes[field]?.isImage ? (
                        <Input
                          id={`${field}-${index}`}
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              handleDataChange(index, field, file)
                            }
                          }}
                        />
                      ) : (
                        <Input
                          id={`${field}-${index}`}
                          type="text"
                          value={practicalData[index]?.[field] as string || ''}
                          onChange={(e) => handleDataChange(index, field, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
            <Button type="submit" disabled={isGenerating} className="w-full">
              {isGenerating ? 'Generating...' : 'Generate Document'}
            </Button>
          </form>
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}