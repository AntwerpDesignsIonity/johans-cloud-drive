/**
 * Gemini AI Service
 * Provides AI-powered file summaries and OCR via Google Gemini 2.0 Flash
 */

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "/api"
const GEMINI_URL = () => `${API_BASE_URL}/gemini`

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
  const response = await fetch(GEMINI_URL(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ parts }),
  })

  const contentType = response.headers.get("content-type") || ""
  let data = null
  let rawText = ""

  if (contentType.includes("application/json")) {
    data = await response.json()
  } else {
    rawText = await response.text()
  }

  if (!response.ok) {
    if (data?.error) {
      throw new Error(`Gemini backend error: ${data.error}`)
    }

    if (rawText.trim().startsWith("<")) {
      throw new Error(
        "Gemini backend endpoint is unavailable and returned HTML instead of JSON. Ensure Cloud Function 'geminiProxy' is deployed and healthy."
      )
    }

    throw new Error(`Gemini backend error: HTTP ${response.status}`)
  }

  if (!data) {
    if (rawText.trim().startsWith("<")) {
      throw new Error(
        "Gemini backend endpoint returned HTML instead of JSON. Check Firebase Hosting rewrite and Cloud Function deployment."
      )
    }
    throw new Error("Gemini backend returned an unexpected non-JSON response.")
  }

  if (data.error) {
    throw new Error(`Gemini backend error: ${data.error}`)
  }

  if (data.text) return data.text
  throw new Error("Gemini backend returned no response text.")
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

/**
 * Batch-summarize multiple files at once.
 * Calls summarizeFile for each and returns a structured report.
 * Useful for getting a quick overview of many files.
 *
 * @param {Array<{name: string, url: string}>} files
 * @param {function(number, number):void}      onProgress  – (done, total)
 * @returns {Promise<string>}  Markdown-formatted report
 */
export async function batchSummarize(files, onProgress) {
  if (!files || files.length === 0) return "No files provided."

  const results = []
  for (let i = 0; i < files.length; i++) {
    const f = files[i]
    if (onProgress) onProgress(i, files.length)
    try {
      const summary = await summarizeFile(f.url, f.name)
      results.push({ name: f.name, summary, error: null })
    } catch (e) {
      results.push({ name: f.name, summary: null, error: e.message })
    }
  }
  if (onProgress) onProgress(files.length, files.length)

  // Build a readable Markdown report
  const lines = [`## Batch Summary — ${files.length} file(s)\n`]
  results.forEach((r, idx) => {
    lines.push(`### ${idx + 1}. ${r.name}`)
    if (r.error) {
      lines.push(`> ⚠️ Error: ${r.error}`)
    } else {
      lines.push(r.summary || "_No summary returned._")
    }
    lines.push("")
  })
  return lines.join("\n")
}

export async function generateContent(prompt) {
  try {
    const resultText = await callGemini([{ text: prompt }])
    return resultText
  } catch (err) {
    console.error("AI Generation error:", err)
    throw new Error("Failed to generate content: " + err.message)
  }
}
