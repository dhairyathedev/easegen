import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const filePath = path.join(process.cwd(), 'mappings', `${params.id}.json`)

  try {
    const data = await readFile(filePath, 'utf-8')
    const mappings = JSON.parse(data)
    return NextResponse.json({ mappings }, { status: 200 })
  } catch (error) {
    console.error('Error reading mappings:', error)
    return NextResponse.json({ error: 'Error reading mappings' }, { status: 500 })
  }
}