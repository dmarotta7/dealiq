export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const body = req.body
    let messages = [...(body.messages || [])]
    const isSearchRequest = (body.tools || []).some(t => t.type === 'web_search_20250305')

    const response1 = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.VITE_ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05'
      },
      body: JSON.stringify({ ...body, messages })
    })

    const data1 = await response1.json()

    if (!isSearchRequest || data1.stop_reason !== 'tool_use') {
      return res.status(200).json(data1)
    }

    // Model used web search tool — continue the conversation
    messages = [
      ...messages,
      { role: 'assistant', content: data1.content },
      {
        role: 'user',
        content: data1.content
          .filter(b => b.type === 'tool_use')
          .map(b => ({
            type: 'tool_result',
            tool_use_id: b.id,
            content: 'Web search completed successfully. Now format all findings as the JSON schema requested.'
          }))
      }
    ]

    const response2 = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.VITE_ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05'
      },
      body: JSON.stringify({ ...body, messages })
    })

    const data2 = await response2.json()
    return res.status(200).json(data2)

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
