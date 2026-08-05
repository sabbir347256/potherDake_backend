import nodemailer from "nodemailer";
import envVars from "../../config/envars";

export const sendVerificationEmail = async (email: string, code: string) => {
  const transporter = nodemailer.createTransport({
    host: envVars.MAIL_HOST || "smtp.gmail.com",
    port: Number(envVars.MAIL_PORT) || 587,
    secure: false, 
    auth: {
      user: envVars.MAIL_USER,
      pass: envVars.MAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Pother-Dake" <${envVars.MAIL_USER}>`,
    to: email,
    subject: "Verify Your Account - Pother Dake",
    text: `Your verification code is: ${code}. It will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2 style="color: #333;">Welcome to Pother-Dake!</h2>
        <p>Your verification code is:</p>
        <h1 style="color: #007bff; letter-spacing: 2px;">${code}</h1>
        <p>This code is valid for <b>10 minutes</b>.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};