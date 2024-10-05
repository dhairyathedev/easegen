'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function Preview({ params }: { params: { id: string } }) {
  const [previewUrl, setPreviewUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/preview/${params.id}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load preview')
        }
        return response.blob()
      })
      .then(blob => {
        const url = URL.createObjectURL(blob)
        setPreviewUrl(url)
      })
      .catch(err => {
        console.error('Error loading preview:', err)
        setError('Failed to load document preview. Please try downloading the file.')
      })
  }, [params.id])

  const handleDownload = () => {
    window.location.href = `/api/download/${params.id}`
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold mb-4">Preview and Download</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <iframe src={previewUrl} className="w-full h-[600px] mb-4 border rounded" />
          )}
          <Button onClick={handleDownload} className="w-full">
            Download Document
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}