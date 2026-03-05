/**
 * Gemini AI Service
 * Provides AI-powered file summaries and OCR via Google Gemini 1.5 Flash
 */

const MODEL = "gemini-1.5-flash"
const GEMINI_URL = () =>
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${process.env.REACT_APP_GEMINI_API_KEY}`

const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff", "tif", "svg"]
const TEXT_EXTS = [
  "txt", "md", "csv", "json", "xml", "html", "htm",
  "js", "jsx", "ts", "tsx", "py", "css", "scss",
  "sh", "bash", "yaml", "yml", "log", "ini", "conf",
]
const PDF_EXTS = ["pdf"]

async function urlToBase64(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to fetch file: ${response.statusText}`)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const [header, base64] = reader.result.split(",")
      const mimeType =
        blob.type || header.replace("data:", "").replace(";base64", "") || "application/octet-stream"
      resolve({ base64, mimeType })
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function callGemini(parts) {
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY
  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
    throw new Error(
      "Gemini API key not configured. Add REACT_APP_GEMINI_API_KEY=<your_key> to your .env file."
    )
  }
  const response = await fetch(GEMINI_URL(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.4,
      },
    }),
  })
  const data = await response.json()
  if (data.error) throw new Error(`Gemini error: ${data.error.message}`)
  if (data.candidates?.length > 0) {
    return data.candidates[0].content.parts[0].text
  }
  throw new Error("Gemini returned no response. Check your API key and quota.")
}

/**
 * Generate an AI summary for a file.
 * Supports images (vision), text files (content fetch), and any other file by name.
 */
export async function summarizeFile(fileUrl, fileName) {
  const ext = (fileName.split(".").pop() || "").toLowerCase()
  let parts = []

  if (IMAGE_EXTS.includes(ext)) {
    try {
      const { base64, mimeType } = await urlToBase64(fileUrl)
      parts = [
        {
          text: `Analyze this image file named "${fileName}". Provide a concise but thorough summary covering: (1) what is shown, (2) key subjects or elements, (3) any text visible, (4) overall context or purpose. Keep it to 3-5 sentences.`,
        },
        { inline_data: { mime_type: mimeType, data: base64 } },
      ]
    } catch {
      parts = [
        {
          text: `Provide a likely description of an image file named "${fileName}" based on its filename.`,
        },
      ]
    }
  } else if (TEXT_EXTS.includes(ext)) {
    try {
      const resp = await fetch(fileUrl)
      const text = await resp.text()
      const truncated = text.substring(0, 6000)
      parts = [
        {
          text: `Summarize the following file "${fileName}":\n\nFile content:\n${truncated}\n\n---\nProvide a clear, concise summary in 3-5 sentences covering the main purpose, key information, and notable details.`,
        },
      ]
    } catch {
      parts = [
        {
          text: `Describe what a file named "${fileName}" likely contains based on its name and extension.`,
        },
      ]
    }
  } else if (PDF_EXTS.includes(ext)) {
    try {
      const { base64, mimeType } = await urlToBase64(fileUrl)
      parts = [
        {
          text: `Summarize this PDF document named "${fileName}". Cover the main topics, key points, and overall purpose in 4-6 sentences.`,
        },
        { inline_data: { mime_type: mimeType || "application/pdf", data: base64 } },
      ]
    } catch {
      parts = [
        {
          text: `Describe what a PDF file named "${fileName}" likely contains based on its name.`,
        },
      ]
    }
  } else {
    parts = [
      {
        text: `Briefly describe what a file named "${fileName}" (${ext.toUpperCase()} format) likely contains or is used for. 2-3 sentences.`,
      },
    ]
  }

  return callGemini(parts)
}

/**
 * Extract text from images and PDFs using Gemini Vision (OCR).
 */
export async function ocrFile(fileUrl, fileName) {
  const ext = (fileName.split(".").pop() || "").toLowerCase()
  const supported = [...IMAGE_EXTS, ...PDF_EXTS]

  if (!supported.includes(ext)) {
    throw new Error(
      `OCR supports images (${IMAGE_EXTS.join(", ")}) and PDFs. "${ext.toUpperCase()}" is not supported.`
    )
  }

  const { base64, mimeType } = await urlToBase64(fileUrl)
  const parts = [
    {
      text: "Extract and transcribe ALL text visible in this file. Preserve the original structure, formatting, headers, bullet points, tables, and paragraph breaks as closely as possible. Return only the extracted text, nothing else.",
    },
    { inline_data: { mime_type: mimeType || "application/octet-stream", data: base64 } },
  ]

  return callGemini(parts)
}
