import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

type DigestItem = { title: string; date: string };
type ProjectSummary = { name: string; summary: string };

type DigestEmailInput = {
  to: string;
  name: string;
  overdue: DigestItem[];
  dueThisWeek: DigestItem[];
  meetingsThisWeek: DigestItem[];
  projectSummaries: ProjectSummary[];
  appUrl: string;
};

function formatItem(item: DigestItem) {
  const d = new Date(item.date);
  const dateStr = d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Dhaka"
  });
  return `<li style="margin-bottom:6px;"><span style="color:#8A8D93;font-family:monospace;font-size:12px;">${dateStr}</span> — ${item.title}</li>`;
}

function section(title: string, items: DigestItem[], color: string) {
  if (items.length === 0) return "";
  return `
    <h3 style="color:${color};font-size:13px;text-transform:uppercase;letter-spacing:0.05em;margin:20px 0 8px;">${title} (${items.length})</h3>
    <ul style="list-style:none;padding:0;margin:0;color:#EDEDED;font-size:14px;">${items.map(formatItem).join("")}</ul>
  `;
}

function projectSummarySection(summaries: ProjectSummary[]) {
  if (summaries.length === 0) return "";
  const cards = summaries
    .map(
      (s) => `
      <div style="background:#18181A;border:1px solid #2A2A2D;border-radius:8px;padding:12px 14px;margin-bottom:8px;">
        <div style="color:#F5F5F5;font-size:13px;font-weight:600;margin-bottom:4px;">${s.name}</div>
        <div style="color:#C9C9CC;font-size:13px;line-height:1.5;">${s.summary}</div>
      </div>
    `
    )
    .join("");
  return `
    <h3 style="color:#5EC9C0;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;margin:20px 0 8px;">Project status</h3>
    ${cards}
  `;
}

// Sends the weekly digest email via Resend. Never throws — a failed email
// should never take down the cron run for the other users in the loop.
export async function sendWeeklyDigestEmail(input: DigestEmailInput) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping digest email to", input.to);
    return;
  }

  const html = `
    <div style="font-family:-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#0F0F10;">
      <h2 style="color:#F5F5F5;margin:0 0 4px;">Your weekly digest</h2>
      <p style="color:#8A8D93;font-size:13px;margin:0 0 8px;">Hi ${input.name}, here's what's on your plate this week.</p>
      ${projectSummarySection(input.projectSummaries)}
      ${section("Overdue", input.overdue, "#FF7A45")}
      ${section("Due this week", input.dueThisWeek, "#F5B95B")}
      ${section("Meetings this week", input.meetingsThisWeek, "#8A8D93")}
      <a href="${input.appUrl}" style="display:inline-block;margin-top:24px;padding:10px 18px;background:#E8342B;color:#fff;text-decoration:none;border-radius:8px;font-size:13px;">
        Open calendar
      </a>
    </div>
  `;

  try {
    await resend.emails.send({
      from: process.env.DIGEST_FROM_EMAIL || "TaskFlow <onboarding@resend.dev>",
      to: input.to,
      subject: "Your weekly digest — TaskFlow",
      html
    });
  } catch (err) {
    console.error("Digest email failed for", input.to, err);
  }
}