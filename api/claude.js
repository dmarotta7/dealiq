export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.VITE_ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05'
      },
      body: JSON.stringify(req.body)
    })

    const data = await response.json()

    // If the model hit max tokens or stopped early, keep going
    if (data.stop_reason === 'max_tokens' || data.stop_reason === 'tool_use') {
      // Return whatever we have
      return res.status(200).json(data)
    }

    res.status(200).json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
