import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  const { id, mappings } = await request.json()

  const filePath = path.join(process.cwd(), 'mappings', `${id}.json`)

  try {
    await writeFile(filePath, JSON.stringify(mappings))
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error saving mappings:', error)
    return NextResponse.json({ error: 'Error saving mappings' }, { status: 500 })
  }
}