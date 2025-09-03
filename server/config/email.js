const nodemailer = require("nodemailer");

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
  const subject = `Update on your ${formType || "form"} submission`;

  const text = [
    `Hello${name ? " " + name : ""},`,
    ``,
    `We wanted to update you on the status of your ${formType || "form"} submission.`,
    ``,
    `📌 Current status: ${statusText}`,
    notes ? `\n📝 Notes from our team: ${notes}` : "",
    ``,
    `If you have any questions, feel free to reply to this email.`,
    ``,
    `Thank you for choosing V-Monie.`,
    `- The V-Monie Team`,
  ]
    .filter(Boolean)
    .join("\n");

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to,
    subject,
    text,
    replyTo: replyTo || process.env.MAIL_REPLY_TO || process.env.MAIL_FROM, 
  });
}

module.exports = { sendStatusEmail };
