import { NextResponse } from 'next/server'
import { extractText, getDocumentProxy } from 'unpdf'

export const dynamic = 'force-dynamic'

const MAX_BYTES = 5 * 1024 * 1024

// Turns an uploaded CV (PDF / plain text) into text. Nothing is stored here;
// the profile page saves the returned text to the user's own profile row.
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: '請選擇檔案' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: '檔案超過 5 MB' }, { status: 413 })

  const name = file.name.toLowerCase()
  try {
    if (name.endsWith('.pdf') || file.type === 'application/pdf') {
      const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()))
      const { text } = await extractText(pdf, { mergePages: true })
      if (!text.trim()) return NextResponse.json({ error: '這個 PDF 沒有可擷取的文字（可能是掃描圖檔），請改用文字版 PDF' }, { status: 422 })
      return NextResponse.json({ text: text.trim() })
    }
    if (/\.(txt|md)$/.test(name) || file.type.startsWith('text/')) {
      return NextResponse.json({ text: (await file.text()).trim() })
    }
    return NextResponse.json({ error: '目前支援 PDF、TXT、MD；Word 檔請先另存為 PDF' }, { status: 415 })
  } catch (e) {
    return NextResponse.json({ error: `無法讀取檔案：${e instanceof Error ? e.message : String(e)}` }, { status: 422 })
  }
}
