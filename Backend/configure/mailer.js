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

export const sendWelcomeEmail = async (to, name, role) => {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { name: "Flatkart Support", email: "flatkart.support@gmail.com" },
      to: [{ email: to }],
      subject: "Welcome to FLATKART!",
      htmlContent: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:40px;border:1px solid #eee;border-radius:12px;background:#fff">
        <div style="text-align:center;margin-bottom:24px">
          <h1 style="color:#2c3e50;margin:0;font-size:2rem">Welcome to FLATKART!</h1>
        </div>
        <p style="font-size:1.1rem;color:#2c3e50;margin-bottom:16px">Hi <strong>${name}</strong>,</p>
        <p style="color:#555;line-height:1.7;margin-bottom:16px">
          Thank you for joining Flatkart as a <strong>${role === "owner" ? "Property Owner" : "Tenant"}</strong>! We're excited to have you on board.
        </p>
        ${role === "owner" ? `
        <div style="background:#fef9e7;border-left:4px solid #f1c40f;padding:16px;margin:20px 0;border-radius:6px">
          <p style="margin:0;color:#2c3e50;font-weight:600">🏡 As an Owner, you can:</p>
          <ul style="margin:8px 0 0;padding-left:20px;color:#555">
            <li>List your properties in minutes</li>
            <li>Manage bookings with full control</li>
            <li>Chat directly with potential tenants</li>
            <li>Track your listings performance</li>
          </ul>
        </div>
        ` : `
        <div style="background:#eafaf1;border-left:4px solid #1abc9c;padding:16px;margin:20px 0;border-radius:6px">
          <p style="margin:0;color:#2c3e50;font-weight:600">🔍 As a Tenant, you can:</p>
          <ul style="margin:8px 0 0;padding-left:20px;color:#555">
            <li>Search and discover verified flats</li>
            <li>Book your ideal home instantly</li>
            <li>Chat with property owners</li>
            <li>Leave reviews and ratings</li>
          </ul>
        </div>
        `}
        <p style="color:#555;line-height:1.7;margin:20px 0">Get started now and explore all the features Flatkart has to offer!</p>
        <div style="text-align:center;margin:28px 0">
          <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/login" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#1abc9c,#16a085);color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:1rem">Login to Your Account</a>
        </div>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
        <p style="color:#888;font-size:0.85rem;text-align:center;margin:0">Need help? Contact us at <a href="mailto:flatkart.support@gmail.com" style="color:#1abc9c">flatkart.support@gmail.com</a></p>
      </div>`,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to send email");
  }
};
