/**
 * Optional: classify report urgency from description using OpenAI.
 * Returns one of 'low' | 'medium' | 'high' | 'critical', or null if unavailable.
 */
const VALID_URGENCIES = ['low', 'medium', 'high', 'critical'] as const;
export type Urgency = (typeof VALID_URGENCIES)[number];

export function isValidUrgency(s: string): s is Urgency {
  return VALID_URGENCIES.includes(s as Urgency);
}

export async function classifyUrgency(description: string): Promise<Urgency | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey?.trim()) return null;

  const systemPrompt = `You classify water safety reports by urgency. Reply with exactly one word: low, medium, high, or critical. Consider: contamination, flooding, no water, smell, color, illness, etc.`;
  const userPrompt = `Classify urgency for this report: "${description.slice(0, 500)}"`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 10,
      }),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content?.trim().toLowerCase();
    if (!content) return null;
    const word = content.split(/\s+/)[0];
    return isValidUrgency(word) ? word : null;
  } catch {
    return null;
  }
}
