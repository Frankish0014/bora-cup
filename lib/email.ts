export type SessionMail = {
  to: string;
  name: string;
  eventName: string;
  sessionName: string;
  cupCount: number;
};

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export function welcomeEmail(mail: SessionMail) {
  const first = mail.name.trim().split(/\s+/)[0] || "there";
  const cups = mail.cupCount === 1 ? "1 cup" : `${mail.cupCount} cups`;
  const subject = `Welcome to ${mail.sessionName}`;
  const text = [
    `Hi ${first},`,
    ``,
    `Welcome to ${mail.sessionName}${mail.eventName ? ` at ${mail.eventName}` : ""}.`,
    ``,
    `There ${mail.cupCount === 1 ? "is" : "are"} ${cups} on the table, left to right. Cup 1 is the first coffee on your sheet.`,
    ``,
    `Rate each coffee, add notes if you like, then tap Save and submit. You can return with this same email to continue or edit.`,
    ``,
    `Thank you for cupping with us.`,
  ].join("\n");
  const html = layout(`
    <p style="margin:0 0 16px">Hi ${escapeHtml(first)},</p>
    <p style="margin:0 0 16px">Welcome to <strong>${escapeHtml(mail.sessionName)}</strong>${mail.eventName ? ` at ${escapeHtml(mail.eventName)}` : ""}.</p>
    <p style="margin:0 0 16px">There ${mail.cupCount === 1 ? "is" : "are"} ${escapeHtml(cups)} on the table, left to right. Cup 1 is the first coffee on your sheet.</p>
    <p style="margin:0">Rate each coffee, add notes if you like, then tap <strong>Save and submit</strong>. You can return with this same email to continue or edit.</p>
  `);
  return { subject, text, html };
}

export function thanksEmail(mail: SessionMail) {
  const first = mail.name.trim().split(/\s+/)[0] || "there";
  const subject = `Thank you for cupping ${mail.sessionName}`;
  const text = [
    `Hi ${first},`,
    ``,
    `Thank you for cupping ${mail.sessionName}${mail.eventName ? ` at ${mail.eventName}` : ""}. Your notes and ratings are saved.`,
    ``,
    `If you need to change something, open the session again with this same email.`,
    ``,
    `We appreciate your time at the table.`,
  ].join("\n");
  const html = layout(`
    <p style="margin:0 0 16px">Hi ${escapeHtml(first)},</p>
    <p style="margin:0 0 16px">Thank you for cupping <strong>${escapeHtml(mail.sessionName)}</strong>${mail.eventName ? ` at ${escapeHtml(mail.eventName)}` : ""}. Your notes and ratings are saved.</p>
    <p style="margin:0">If you need to change something, open the session again with this same email.</p>
  `);
  return { subject, text, html };
}

export async function sendSessionEmail(kind: "welcome" | "thanks", mail: SessionMail) {
  if (!isEmailConfigured()) return { sent: false };
  const template = kind === "welcome" ? welcomeEmail(mail) : thanksEmail(mail);
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [mail.to],
        subject: template.subject,
        text: template.text,
        html: template.html,
      }),
    });
    if (!response.ok) return { sent: false };
    return { sent: true };
  } catch {
    return { sent: false };
  }
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function layout(body: string) {
  return `<div style="font-family:ui-sans-serif,system-ui,sans-serif;color:#1c1e21;line-height:1.55;font-size:16px;max-width:32rem">
  ${body}
  <p style="margin:28px 0 0;font-size:13px;color:#8b929c">Bora Cup</p>
</div>`;
}
