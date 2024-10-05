'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function DataEntry({ params }: { params: { id: string } }) {
  const [mappings, setMappings] = useState<Record<string, string>>({})
  const [practicalCount, setPracticalCount] = useState(1)
  const [practicalData, setPracticalData] = useState<Record<string, string>[]>([{}])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Fetch mappings from the server
    fetch(`/api/mappings/${params.id}`)
      .then(res => res.json())
      .then(data => setMappings(data.mappings))
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

  const handleDataChange = (practicalIndex: number, field: string, value: string) => {
    setPracticalData(prev => {
      const newData = [...prev]
      newData[practicalIndex] = { ...newData[practicalIndex], [field]: value }
      return newData
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: params.id, practicalData }),
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
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="practicalCount">
              Number of Practicals
            </label>
            <Input
              type="number"
              id="practicalCount"
              min="1"
              value={practicalCount}
              onChange={handlePracticalCountChange}
            />
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {practicalData.map((practical, index) => (
              <Card key={index} className="p-4">
                <CardTitle className="text-xl font-bold mb-4">Practical {index + 1}</CardTitle>
                <div className="space-y-4">
                  {Object.entries(mappings).map(([placeholder, field]) => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={`${field}-${index}`}>
                        {field}
                      </label>
                      <Input
                        type="text"
                        id={`${field}-${index}`}
                        value={practical[field] || ''}
                        onChange={e => handleDataChange(index, field, e.target.value)}
                      />
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