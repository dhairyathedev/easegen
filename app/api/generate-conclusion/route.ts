import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  const { practicalData } = await request.json()

  if (!practicalData) {
    return NextResponse.json({ error: 'Practical data is required' }, { status: 400 })
  }

  const prompt = `Generate a concise conclusion based on the following practical data:
${JSON.stringify(practicalData, null, 2)}

Please summarize the key findings, outcomes, or insights from these practicals. Do not include any code, images or markdown. Give only one paragraph of around 100 words.`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    })

    const generatedConclusion = completion.choices[0].message.content

    return NextResponse.json({ conclusion: generatedConclusion }, { status: 200 })
  } catch (error) {
    console.error('Error generating conclusion:', error)
    return NextResponse.json({ error: 'Failed to generate conclusion' }, { status: 500 })
  }
}