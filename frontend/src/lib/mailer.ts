import nodemailer from "nodemailer";

const SMTP_USER = process.env.SMTP_USER || "[email protected]";
const SMTP_PASS = process.env.SMTP_PASS || "lczo qral ctwg idpe";
const MAIL_TO = process.env.MAIL_TO || "[email protected]";

let cachedTransport: nodemailer.Transporter | null = null;

export function getTransport() {
  if (cachedTransport) return cachedTransport;
  cachedTransport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return cachedTransport;
}

export async function sendMail(opts: { subject: string; html: string; replyTo?: string }) {
  const t = getTransport();
  await t.sendMail({
    from: `"PaymentsHub · doublethree" <${SMTP_USER}>`,
    to: MAIL_TO,
    replyTo: opts.replyTo,
    subject: opts.subject,
    html: opts.html,
  });
}

export function htmlEscape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
