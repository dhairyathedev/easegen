'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function Upload() {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<{ email: string; created_at: string } | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
      setError(null)
    }
  }

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
      }else{
        setUser({
          email: user.email!,
          created_at: new Date(user.created_at).toLocaleString(),
        })
      }
    }
    checkUser()
  }, [supabase, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setIsUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        router.push(`/map/${data.id}`)
      } else {
        setError(data.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Error:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsUploading(false)
    }
  }

  if(!user){
    return <div>Loading...</div>
  }
  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold mb-4">Upload Template</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="file"
              accept=".docx"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <Button type="submit" disabled={!file || isUploading} className="w-full">
              {isUploading ? 'Uploading...' : 'Upload'}
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