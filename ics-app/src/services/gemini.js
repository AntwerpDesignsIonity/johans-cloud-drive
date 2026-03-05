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

/**
 * Suggest tags/keywords for a file using Gemini AI.
 * Returns a comma-separated string of lowercase tags.
 */
export async function suggestTags(fileUrl, fileName) {
  const ext = (fileName.split(".").pop() || "").toLowerCase()
  let parts = []

  if (IMAGE_EXTS.includes(ext)) {
    try {
      const { base64, mimeType } = await urlToBase64(fileUrl)
      parts = [
        {
          text: `Analyze this image named "${fileName}" and produce 6–10 concise relevant tags. Return ONLY a comma-separated list of lowercase tags with no explanations, no numbering, no extra text. Example: nature, sunset, landscape, photography, outdoor`,
        },
        { inline_data: { mime_type: mimeType, data: base64 } },
      ]
    } catch {
      parts = [{ text: `Generate 6–10 relevant tags for a file named "${fileName}". Return ONLY a comma-separated list of lowercase tags.` }]
    }
  } else if (TEXT_EXTS.includes(ext)) {
    try {
      const resp = await fetch(fileUrl)
      const text = await resp.text()
      const truncated = text.substring(0, 4000)
      parts = [
        {
          text: `Generate 6–10 relevant tags for the file "${fileName}" based on its content:\n\n${truncated}\n\nReturn ONLY a comma-separated list of lowercase tags, no explanations.`,
        },
      ]
    } catch {
      parts = [{ text: `Generate 6–10 relevant tags for a file named "${fileName}". Return ONLY a comma-separated list of lowercase tags.` }]
    }
  } else if (PDF_EXTS.includes(ext)) {
    try {
      const { base64, mimeType } = await urlToBase64(fileUrl)
      parts = [
        {
          text: `Analyze this PDF named "${fileName}" and produce 6–10 concise topic tags. Return ONLY a comma-separated list of lowercase tags, no explanations.`,
        },
        { inline_data: { mime_type: mimeType || "application/pdf", data: base64 } },
      ]
    } catch {
      parts = [{ text: `Generate 6–10 relevant tags for a PDF file named "${fileName}". Return ONLY a comma-separated list of lowercase tags.` }]
    }
  } else {
    parts = [
      {
        text: `Generate 6–10 relevant tags for a file named "${fileName}" (${ext.toUpperCase()} format). Return ONLY a comma-separated list of lowercase tags, no explanations, no numbering.`,
      },
    ]
  }

  return callGemini(parts)
}

/**
 * Suggest 3 cleaner, more descriptive filenames based on file content and name.
 */
export async function suggestRename(fileUrl, fileName) {
  const ext = (fileName.split(".").pop() || "").toLowerCase()
  let contentHint = ""

  if (TEXT_EXTS.includes(ext)) {
    try {
      const resp = await fetch(fileUrl)
      const text = await resp.text()
      contentHint = `\n\nContent preview:\n${text.substring(0, 2000)}`
    } catch {}
  }

  const parts = [
    {
      text: `The current filename is "${fileName}".${contentHint}\n\nSuggest exactly 3 clean, descriptive alternative filenames (keeping the same ".${ext}" extension).\nRules: use-kebab-case, be descriptive, no special characters except hyphens, all lowercase.\nReturn ONLY a numbered list of 3 filenames, one per line, nothing else.\nExample:\n1. descriptive-topic-name.${ext}\n2. project-document-v2.${ext}\n3. clear-subject-title.${ext}`,
    },
  ]

  return callGemini(parts)
}

/**
 * Answer a custom user question about a file using Gemini AI.
 */
export async function askAboutFile(fileUrl, fileName, question) {
  const ext = (fileName.split(".").pop() || "").toLowerCase()
  let parts = []

  if (IMAGE_EXTS.includes(ext)) {
    try {
      const { base64, mimeType } = await urlToBase64(fileUrl)
      parts = [
        {
          text: `File: "${fileName}"\nQuestion: ${question}\n\nPlease answer based on the image content. Be concise and accurate.`,
        },
        { inline_data: { mime_type: mimeType, data: base64 } },
      ]
    } catch {
      parts = [{ text: `Regarding an image file named "${fileName}": ${question}` }]
    }
  } else if ([...TEXT_EXTS, ...PDF_EXTS].includes(ext)) {
    try {
      const resp = await fetch(fileUrl)
      const text = await resp.text()
      const truncated = text.substring(0, 6000)
      parts = [
        {
          text: `File: "${fileName}"\n\nContent:\n${truncated}\n\n---\nQuestion: ${question}\n\nAnswer based strictly on the file content above.`,
        },
      ]
    } catch {
      parts = [{ text: `Regarding a file named "${fileName}" (${ext.toUpperCase()}): ${question}` }]
    }
  } else {
    parts = [
      {
        text: `Regarding a file named "${fileName}" (${ext.toUpperCase()} format): ${question}. Provide a helpful answer based on what this type of file typically contains.`,
      },
    ]
  }

  return callGemini(parts)
}

/**
 * Generate a smart description for a folder based on its name and child item names.
 */
export async function summarizeFolder(folderName, childNames) {
  const sample = childNames.slice(0, 30).join(", ")
  const total = childNames.length
  const parts = [
    {
      text: `A cloud storage folder named "${folderName}" contains ${total} item(s)${total > 0 ? `: ${sample}${total > 30 ? ", …" : ""}` : ""}.\n\nIn 2-3 sentences, describe what this folder likely contains and its purpose, based on the folder name and the file names listed. Be concise and practical.`,
    },
  ]
  return callGemini(parts)
}
