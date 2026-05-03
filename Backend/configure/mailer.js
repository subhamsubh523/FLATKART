export const sendOTPEmail = async (to, otp, subject = "Reset Your Password", heading = "📧 Email Verification", bodyText = "Use the OTP below to verify your email:") => {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { name: "Flatkart Support", email: "flatkart.support@gmail.com" },
      to: [{ email: to }],
      subject,
      htmlContent: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #eee;border-radius:10px">
        <h2 style="color:#2c3e50">${heading}</h2>
        <p>${bodyText}</p>
        <div style="font-size:2.5rem;font-weight:bold;letter-spacing:12px;color:#2c3e50;text-align:center;padding:20px;background:#f0f2f5;border-radius:8px;margin:20px 0">
          ${otp}
        </div>
        <p style="color:#888;font-size:0.9rem">This OTP is valid for <b>10 minutes</b>. Do not share it with anyone.</p>
        <p style="color:#888;font-size:0.9rem">If you did not request this, please contact our support team at flatkart.support@gmail.com.</p>
      </div>`,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to send email");
  }
};
