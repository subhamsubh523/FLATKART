import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_LOGIN,
    pass: process.env.BREVO_SMTP_PASSWORD,
  },
  pool: true,
  maxConnections: 3,
});

export const sendOTPEmail = async (to, otp, subject = "Reset Your Password", heading = "📧 Email Verification", bodyText = "Use the OTP below to verify your email:") => {
  await transporter.sendMail({
    from: `"Flatkart Support" <flatkart.support@gmail.com>`,
    to,
    subject,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #eee;border-radius:10px">
        <h2 style="color:#2c3e50">${heading}</h2>
        <p>${bodyText}</p>
        <div style="font-size:2.5rem;font-weight:bold;letter-spacing:12px;color:#2c3e50;text-align:center;padding:20px;background:#f0f2f5;border-radius:8px;margin:20px 0">
          ${otp}
        </div>
        <p style="color:#888;font-size:0.9rem">This OTP is valid for <b>10 minutes</b>. Do not share it with anyone.</p>
        <p style="color:#888;font-size:0.9rem">If you did not request this, please contact our support team at flatkart.support@gmail.com.</p>
      </div>
    `,
  });
};
