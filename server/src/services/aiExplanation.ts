/**
 * Optional: turn the heuristic result into one short AI-generated sentence for the user.
 * Set OPENAI_API_KEY in .env to enable.
 */
export async function getAiExplanation(
  score: number,
  heuristicExplanation: string,
  lat: number,
  lng: number
): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    console.log('[AI] No OPENAI_API_KEY in env — skipping AI explanation');
    return null;
  }

  try {
    console.log('[AI] Calling OpenAI...');
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: `You are a water safety assistant. In one short sentence (under 20 words), tell the user what this water safety result means. Be clear and calm.

Water safety score: ${score}/100 (higher = safer).
Factors: ${heuristicExplanation}
Location: ${lat}, ${lng}

Reply with only that one sentence, no quotes or preamble.`,
          },
        ],
        max_tokens: 80,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error('[AI] OpenAI error', res.status, errBody.slice(0, 200));
      return null;
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (text) console.log('[AI] Got response:', text.slice(0, 80) + (text.length > 80 ? '...' : ''));
    else console.warn('[AI] Empty content in OpenAI response');
    return text || null;
  } catch (e) {
    console.error('[AI] Request failed:', e instanceof Error ? e.message : e);
    return null;
  }
}
