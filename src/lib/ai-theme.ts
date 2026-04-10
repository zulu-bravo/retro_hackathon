import Anthropic from "@anthropic-ai/sdk";

const VALID_THEMES = [
  "tooling",
  "process",
  "communication",
  "scope",
  "staffing",
  "quality",
  "morale",
  "other",
] as const;

export type AiTheme = (typeof VALID_THEMES)[number];

export async function classifyTheme(
  content: string,
  category: string
): Promise<AiTheme | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("ANTHROPIC_API_KEY not set — skipping ai_theme classification");
    return null;
  }

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 16,
      system: `You are a retro feedback classifier. Given a feedback item from a sprint retrospective, respond with exactly one theme from this list: ${VALID_THEMES.join(", ")}. Respond with only the single word — nothing else.`,
      messages: [
        {
          role: "user",
          content: `Category: ${category}\nFeedback: ${content}`,
        },
      ],
    });

    const text =
      message.content[0].type === "text"
        ? message.content[0].text.trim().toLowerCase()
        : null;

    if (text && VALID_THEMES.includes(text as AiTheme)) {
      return text as AiTheme;
    }
    return "other";
  } catch (err) {
    console.warn("ai_theme classification failed:", err);
    return null;
  }
}
