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

  // Standard SMTP transport (note: nodemailer method is createTransport, not createTransporter)
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

// Send password reset email
async function sendPasswordResetEmail({ to, resetToken, name }) {
  if (!to) return;

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const brandColor = "#2563eb";

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
          <p style="margin:0 0 16px 0; color:#334155;">You requested a password reset for your V-Monie account.</p>
          
          <div style="margin:20px 0; text-align:center;">
            <a href="${resetUrl}" style="display:inline-block; padding:12px 24px; background:${brandColor}; color:white; text-decoration:none; border-radius:8px; font-weight:600;">Reset Password</a>
          </div>
          
          <p style="margin:16px 0; color:#334155; font-size:14px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="margin:0 0 16px 0; color:#6366f1; font-size:14px; word-break:break-all;">${resetUrl}</p>
          
          <p style="margin:16px 0; color:#334155;">This link will expire in 1 hour for security reasons.</p>
          <p style="margin:16px 0; color:#334155;">If you didn't request this reset, please ignore this email.</p>
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

  const text = `
Hello${name ? " " + name : ""},

You requested a password reset for your V-Monie account.

Click this link to reset your password: ${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request this reset, please ignore this email.

- The V-Monie Team
  `;

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to,
    subject: "Reset your V-Monie password",
    text,
    html,
    replyTo: process.env.MAIL_REPLY_TO || process.env.MAIL_FROM,
  });
}

// Send task assignment notification
async function sendTaskAssignmentEmail({
  to,
  taskTitle,
  taskDescription,
  assignedBy,
  dueDate,
  name,
}) {
  if (!to) return;

  const brandColor = "#2563eb";
  const dashboardUrl = `${process.env.FRONTEND_URL}/aggregator/dashboard/tasks`;

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
          <p style="margin:0 0 16px 0; color:#334155;">A new task has been assigned to you.</p>
          
          <div style="margin:16px 0; padding:16px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px;">
            <h3 style="margin:0 0 8px 0; color:#0f172a; font-size:18px;">${taskTitle}</h3>
            ${taskDescription ? `<p style="margin:0 0 12px 0; color:#334155;">${taskDescription}</p>` : ""}
            <div style="font-size:14px; color:#64748b;">
              <p style="margin:4px 0;">Assigned by: ${assignedBy}</p>
              ${dueDate ? `<p style="margin:4px 0;">Due date: ${new Date(dueDate).toLocaleDateString()}</p>` : ""}
            </div>
          </div>
          
          <div style="margin:20px 0; text-align:center;">
            <a href="${dashboardUrl}" style="display:inline-block; padding:12px 24px; background:${brandColor}; color:white; text-decoration:none; border-radius:8px; font-weight:600;">View Task</a>
          </div>
          
          <p style="margin:16px 0; color:#334155;">Please log in to your dashboard to view the complete task details and start working on it.</p>
          <p style="margin:0; font-weight:600; color:#0f172a;">- The V-Monie Team</p>
        </td>
      </tr>
    </table>
  </div>`;

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to,
    subject: `New Task Assigned: ${taskTitle}`,
    html,
    replyTo: process.env.MAIL_REPLY_TO || process.env.MAIL_FROM,
  });
}

// Send dispute notification
async function sendDisputeNotificationEmail({
  to,
  disputeTitle,
  disputeDescription,
  raisedBy,
  name,
}) {
  if (!to) return;

  const brandColor = "#2563eb";
  const dashboardUrl = `${process.env.FRONTEND_URL}/aggregator/dashboard/disputes`;

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
          <p style="margin:0 0 16px 0; color:#334155;">A dispute has been raised against you that requires your attention.</p>
          
          <div style="margin:16px 0; padding:16px; background:#fef2f2; border:1px solid #fecaca; border-radius:8px;">
            <h3 style="margin:0 0 8px 0; color:#dc2626; font-size:18px;">${disputeTitle}</h3>
            <p style="margin:0 0 12px 0; color:#374151;">${disputeDescription}</p>
            <div style="font-size:14px; color:#64748b;">
              <p style="margin:4px 0;">Raised by: ${raisedBy}</p>
            </div>
          </div>
          
          <div style="margin:20px 0; text-align:center;">
            <a href="${dashboardUrl}" style="display:inline-block; padding:12px 24px; background:#dc2626; color:white; text-decoration:none; border-radius:8px; font-weight:600;">Respond to Dispute</a>
          </div>
          
          <p style="margin:16px 0; color:#334155;">Please log in to your dashboard to view the dispute details and provide your response.</p>
          <p style="margin:0; font-weight:600; color:#0f172a;">- The V-Monie Team</p>
        </td>
      </tr>
    </table>
  </div>`;

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to,
    subject: `Dispute Raised: ${disputeTitle}`,
    html,
    replyTo: process.env.MAIL_REPLY_TO || process.env.MAIL_FROM,
  });
}

// Send merchant creation notification
async function sendMerchantCreationEmail({ to, businessName, username, name }) {
  if (!to) return;

  const brandColor = "#2563eb";
  const dashboardUrl = `${process.env.FRONTEND_URL}/merchant/dashboard`;

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
          <p style="margin:0 0 16px 0; color:#334155;">Your merchant account has been successfully created on V-Monie!</p>
          
          <div style="margin:16px 0; padding:16px; background:#f0f9ff; border:1px solid #bae6fd; border-radius:8px;">
            <h3 style="margin:0 0 8px 0; color:#0369a1; font-size:18px;">Account Details</h3>
            <div style="font-size:14px; color:#374151;">
              <p style="margin:4px 0;"><strong>Business Name:</strong> ${businessName}</p>
              <p style="margin:4px 0;"><strong>Username:</strong> @${username}</p>
              <p style="margin:4px 0;"><strong>Email:</strong> ${to}</p>
            </div>
          </div>
          
          <div style="margin:20px 0; text-align:center;">
            <a href="${dashboardUrl}" style="display:inline-block; padding:12px 24px; background:${brandColor}; color:white; text-decoration:none; border-radius:8px; font-weight:600;">Access Dashboard</a>
          </div>
          
          <p style="margin:16px 0; color:#334155;">You can now access your merchant dashboard to manage your business profile and view transaction records.</p>
          <p style="margin:0; font-weight:600; color:#0f172a;">- The V-Monie Team</p>
        </td>
      </tr>
    </table>
  </div>`;

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to,
    subject: "Welcome to V-Monie - Merchant Account Created",
    html,
    replyTo: process.env.MAIL_REPLY_TO || process.env.MAIL_FROM,
  });
}

module.exports = {
  sendStatusEmail,
  sendPasswordResetEmail,
  sendTaskAssignmentEmail,
  sendDisputeNotificationEmail,
  sendMerchantCreationEmail,
};
