import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendOTPEmail(email, otp) {
  await transporter.sendMail({
    from: '"SkillMatrix" <' + process.env.EMAIL_USER + '>',
    to: email,
    subject: 'SkillMatrix - Password Reset OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <div style="background: #10b981; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">SkillMatrix</h1>
        </div>
        <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
          <h2 style="color: #111827; margin-top: 0;">Password Reset OTP</h2>
          <p style="color: #6b7280;">Use the OTP below to reset your password. It expires in 10 minutes.</p>
          <div style="background: white; border: 2px dashed #10b981; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #10b981;">${otp}</span>
          </div>
          <p style="color: #9ca3af; font-size: 12px;">If you did not request this, ignore this email.</p>
        </div>
      </div>
    `,
  });
}