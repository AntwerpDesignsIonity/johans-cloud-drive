const { onRequest } = require("firebase-functions/v2/https")
const { defineSecret } = require("firebase-functions/params")

const geminiApiKey = defineSecret("GEMINI_API_KEY")
const MODEL = "gemini-2.0-flash"

exports.geminiProxy = onRequest(
  {
    region: "europe-west1",
    secrets: [geminiApiKey],
  },
  async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*")
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS")

    if (req.method === "OPTIONS") {
      res.status(204).send("")
      return
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" })
      return
    }

    const parts = req.body?.parts
    if (!Array.isArray(parts) || parts.length === 0) {
      res.status(400).json({ error: "Request body must include a non-empty 'parts' array." })
      return
    }

    const key = geminiApiKey.value()
    if (!key) {
      res.status(500).json({ error: "Server Gemini API key is not configured." })
      return
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`

    try {
      const response = await fetch(endpoint, {
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
      if (!response.ok) {
        res.status(response.status).json({ error: data?.error?.message || "Gemini request failed" })
        return
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) {
        res.status(502).json({ error: "Gemini returned no response content." })
        return
      }

      res.status(200).json({ text })
    } catch (error) {
      res.status(500).json({ error: error?.message || "Unexpected backend error" })
    }
  }
)
