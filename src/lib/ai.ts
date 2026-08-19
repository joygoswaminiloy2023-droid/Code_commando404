// Thin wrapper around Groq's OpenAI-compatible chat completions endpoint.
// Used to turn raw per-project task stats into one human-readable status
// sentence for the weekly digest (e.g. "Team's on pace; 2 tasks overdue in
// Frontend, Maria's carrying most of the load this week").
//
// Deliberately dependency-free (plain fetch, no SDK) and never throws — if
// GROQ_API_KEY isn't set, or the API call fails or times out, we fall back
// to a templated sentence built from the same stats. The digest should
// never depend on an external AI call succeeding.

const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_TIMEOUT_MS = 8000;

export type ProjectLoad = { name: string; openCount: number; overdueCount: number };

export type ProjectStats = {
  projectName: string;
  totalOpenCount: number;
  overdueCount: number;
  dueThisWeekCount: number;
  completedLastWeekCount: number;
  loadByAssignee: ProjectLoad[];
};

export async function generateProjectSummary(stats: ProjectStats): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return fallbackSummary(stats);

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.4,
        max_tokens: 80,
        messages: [
          {
            role: "system",
            content:
              "You write ONE short, plain-English sentence (max 30 words) summarizing a software team's weekly project status for a status digest email. Use the specific numbers and names given. No greeting, no markdown, no quotes around the output, no preamble — output only the sentence itself. Tone: matter-of-fact, like a team lead's quick note."
          },
          { role: "user", content: buildPrompt(stats) }
        ]
      }),
      signal: AbortSignal.timeout(GROQ_TIMEOUT_MS)
    });

    if (!res.ok) {
      console.error("Groq summary request failed:", res.status, await res.text().catch(() => ""));
      return fallbackSummary(stats);
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    return text || fallbackSummary(stats);
  } catch (err) {
    console.error("AI project summary failed, using fallback:", err);
    return fallbackSummary(stats);
  }
}

function buildPrompt(stats: ProjectStats): string {
  const loadLines = stats.loadByAssignee
    .slice(0, 6)
    .map(
      (a) =>
        `${a.name}: ${a.openCount} open${a.overdueCount ? ` (${a.overdueCount} overdue)` : ""}`
    )
    .join("; ");

  return [
    `Project: ${stats.projectName}`,
    `Total open tasks: ${stats.totalOpenCount}`,
    `Overdue: ${stats.overdueCount}`,
    `Due in the next 7 days: ${stats.dueThisWeekCount}`,
    `Completed in the last 7 days: ${stats.completedLastWeekCount}`,
    loadLines ? `Per-person load: ${loadLines}` : "No open tasks currently assigned."
  ].join("\n");
}

// Used whenever the AI call isn't available — keeps the digest fully
// functional without ever depending on GROQ_API_KEY being set.
function fallbackSummary(stats: ProjectStats): string {
  if (stats.totalOpenCount === 0) {
    return `${stats.projectName}: nothing open right now.`;
  }
  const pace =
    stats.overdueCount === 0
      ? "on pace"
      : `${stats.overdueCount} task${stats.overdueCount > 1 ? "s" : ""} overdue`;
  const busiest = [...stats.loadByAssignee].sort((a, b) => b.openCount - a.openCount)[0];
  const loadNote = busiest && busiest.openCount > 0 ? `, ${busiest.name} carrying the most with ${busiest.openCount} open` : "";
  return `${stats.projectName}: ${pace}${loadNote}.`;
}