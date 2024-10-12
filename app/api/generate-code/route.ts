import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  const { aim, language } = await request.json()

  if (!aim || !language) {
    return NextResponse.json({ error: 'Title and language are required' }, { status: 400 })
  }

  const prompt = `Generate a ${language} code snippet for a practical with the following details:
${aim ? `Aim: ${aim}` : ''}
if code asks for the user input, remove the input statement and use the hardcoded values.

In case of java always user public class Main and public static void main(String[] args) method.
Please provide a concise and relevant code only, no markdown or comments.
Stricly follow the above instructions, no markdown or comments are allowed in the code.
`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    })

    const generatedCode = completion.choices[0].message.content

    return NextResponse.json({ code: generatedCode }, { status: 200 })
  } catch (error) {
    console.error('Error generating code:', error)
    return NextResponse.json({ error: 'Failed to generate code' }, { status: 500 })
  }
}