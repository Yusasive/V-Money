const nodemailer = require("nodemailer");
const dns = require("dns");

// Prefer IPv4 address resolution where available to avoid ENETUNREACH when system
// has no IPv6 connectivity but DNS returns IPv6 records.
try {
  if (typeof dns.setDefaultResultOrder === "function") {
    dns.setDefaultResultOrder("ipv4first");
  }
} catch (e) {
  // ignore if not supported on this Node version
}

function createTransporter() {
  if (process.env.MAIL_SERVICE) {
    return nodemailer.createTransport({
      service: process.env.MAIL_SERVICE,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  const port = Number(process.env.MAIL_PORT || 587);
  const secure =
    String(process.env.MAIL_SECURE || "").toLowerCase() === "true" ||
    port === 465;

  return nodemailer.createTransport({
    host: process.env.MAIL_HOST || "smtp.hostinger.com",
    port,
    secure,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
}

const transporter = createTransporter();

async function sendStatusEmail({ to, status, notes, formType, name, replyTo }) {
  if (!to) return;

  const statusText = String(status || "").toUpperCase();
  const subject = (() => {
    const ft = formType || "form";
    switch (String(status || "").toLowerCase()) {
      case "approved":
        return "Your V-Monie account was approved";
      case "rejected":
        return "Your V-Monie account was rejected";
      case "suspended":
        return "Your V-Monie account was suspended";
      case "activated":
        return "Your V-Monie account is active";
      case "pending":
        return "We received your registration";
      case "password_reset":
        return "Password reset instructions";
      default:
        return `Update on your ${ft} submission`;
    }
  })();

  const text = [
    `Hello${name ? " " + name : ""},`,
    ``,
    `We wanted to update you on the status of your ${formType || "form"} submission.`,
    ``,
    `Current status: ${statusText}`,
    notes ? `\nNotes from our team: ${notes}` : "",
    ``,
    `If you have any questions, feel free to reply to this email.`,
    ``,
    `Thank you for choosing V-Monie.`,
    `- The V-Monie Team`,
  ]
    .filter(Boolean)
    .join("\n");

  const brandColor = "#2563eb"; // Tailwind primary blue-600
  const html = `
  <div style="font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'; background:#f8fafc; padding:24px; color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px; margin:0 auto; background:white; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden;">
      <tr>
        <td style="padding:20px 24px; border-bottom:1px solid #e2e8f0; background:linear-gradient(to right, #ffffff, #f8fafc);">
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="width:36px; height:36px; border-radius:8px; background:${brandColor}10; display:flex; align-items:center; justify-content:center;">
              <span style="font-weight:700; color:${brandColor}; font-size:18px;">V</span>
            </div>
            <div style="font-weight:700; font-size:18px; color:#0f172a;">V-Monie</div>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:24px;">
          <p style="margin:0 0 12px 0; font-size:16px;">Hello${name ? " " + name : ""},</p>
          <p style="margin:0 0 16px 0; color:#334155;">We wanted to update you on the status of your ${formType || "form"} submission.</p>

          <div style="margin:16px 0;">
            <span style="display:inline-block; padding:6px 10px; border-radius:8px; background:${brandColor}15; color:${brandColor}; font-weight:600; font-size:13px; letter-spacing:0.3px;">${statusText}</span>
          </div>

          ${notes ? `<div style="margin:12px 0 16px 0; padding:12px 14px; background:#f1f5f9; border:1px solid #e2e8f0; border-radius:10px; color:#334155;">${notes}</div>` : ""}

          <p style="margin:16px 0; color:#334155;">If you have any questions, feel free to reply to this email.</p>
          <p style="margin:16px 0; color:#334155;">Thank you for choosing <strong>V-Monie</strong>.</p>
          <p style="margin:0; font-weight:600; color:#0f172a;">- The V-Monie Team</p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 24px; border-top:1px solid #e2e8f0; background:#f8fafc; color:#64748b; font-size:12px;">
          This is an automated message. Please do not share your account details with anyone.
        </td>
      </tr>
    </table>
  </div>`;

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to,
    subject,
    text,
    html,
    replyTo: replyTo || process.env.MAIL_REPLY_TO || process.env.MAIL_FROM,
  });
}

module.exports = { sendStatusEmail };
