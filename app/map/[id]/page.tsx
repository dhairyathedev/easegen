'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

// Helper function to clean placeholders
const cleanPlaceholder = (placeholder: string) => {
  return placeholder.replace(/^\{+|\}+$/g, '')
}

// Helper function to format placeholders for display
const formatPlaceholderForDisplay = (placeholder: string) => {
  const cleaned = cleanPlaceholder(placeholder)
  return `{{${cleaned}}}`
}

export default function Map({ params }: { params: { id: string } }) {
  const [placeholders, setPlaceholders] = useState<string[]>([])
  const [mappings, setMappings] = useState<Record<string, string>>({})
  const router = useRouter()

  useEffect(() => {
    fetch(`/api/placeholders/${params.id}`)
      .then(res => res.json())
      .then(data => {
        // Clean placeholders when they're received
        const cleanedPlaceholders = data.placeholders.map(cleanPlaceholder)
        setPlaceholders(cleanedPlaceholders)
      })
  }, [params.id])

  const handleMappingChange = (placeholder: string, value: string) => {
    setMappings(prev => ({ ...prev, [placeholder]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Convert mappings to the format expected by the backend
      const processedMappings = Object.entries(mappings).reduce((acc, [key, value]) => {
        const displayKey = formatPlaceholderForDisplay(key)
        acc[displayKey] = value
        return acc
      }, {} as Record<string, string>)

      const response = await fetch('/api/map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: params.id,
          mappings: processedMappings
        }),
      })

      if (response.ok) {
        router.push(`/data/${params.id}`)
      } else {
        const errorData = await response.json()
        console.error('Mapping failed:', errorData)
        // You might want to show an error message to the user here
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 px-4">
      <h1 className="text-4xl font-bold mb-8">Map Placeholders</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        {placeholders.map(placeholder => (
          <div key={placeholder} className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={placeholder}>
              {formatPlaceholderForDisplay(placeholder)}
            </label>
            <input
              type="text"
              id={placeholder}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={mappings[placeholder] || ''}
              onChange={e => handleMappingChange(placeholder, e.target.value)}
            />
          </div>
        ))}
        <Button
          type="submit"
          // className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          className="w-full"
        >
          Next
        </Button>
      </form>
    </div>
  )
}