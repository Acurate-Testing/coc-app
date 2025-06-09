import nodemailer from "nodemailer";

if (!process.env.SMTP_EMAIL) {
  throw new Error("Missing SMTP_EMAIL environment variable");
}

if (!process.env.SMTP_PASSWORD) {
  throw new Error("Missing SMTP_PASSWORD environment variable");
}

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  try {
    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to,
      subject,
      text,
      html: html || text,
    };

    const info = await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Email sending error:", error);
    return false;
  }
}

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/set-password?token=${resetToken}`;

  try {
    const result = await sendEmail({
      to: email,
      subject: "Reset Your Password",
      text: `Click the following link to reset your password: ${resetUrl}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
              <h1 style="color: #2d3748; margin-bottom: 20px; font-size: 24px;">Reset Your Password</h1>
              
              <p style="margin-bottom: 20px;">We received a request to reset your password. Click the button below to create a new password:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  Reset Password
                </a>
              </div>
              
              <p style="margin-bottom: 20px; font-size: 14px; color: #666666;">If the button above doesn't work, you can also copy and paste this link into your browser:</p>
              
              <p style="margin-bottom: 20px; font-size: 14px; color: #666666; word-break: break-all;">
                <a href="${resetUrl}" style="color: #4f46e5;">${resetUrl}</a>
              </p>
              
              <p style="margin-top: 30px; font-size: 14px; color: #666666; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                If you didn't request a password reset, you can safely ignore this email. This link will expire in 1 hour.
              </p>
            </div>
          </body>
        </html>
      `,
    });

    return result;
  } catch (error) {
    console.error("Error in sendPasswordResetEmail:", error);
    throw error;
  }
}

export async function sendAgencyInviteEmail(
  email: string,
  inviteToken: string
) {
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/agency/onboard?token=${inviteToken}`;

  return sendEmail({
    to: email,
    subject: "Complete Your Customer Onboarding",
    text: `Click the following link to complete your agency onboarding: ${inviteUrl}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Complete Your Customer Onboarding</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
            <h1 style="color: #2d3748; margin-bottom: 20px; font-size: 24px;">Welcome to Customer Onboarding</h1>
            
            <p style="margin-bottom: 20px;">You've been invited to join as an agency. Click the button below to complete your agency onboarding process:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" 
                 style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Complete Customer Setup
              </a>
            </div>
            
            <p style="margin-bottom: 20px; font-size: 14px; color: #666666;">If the button above doesn't work, you can also copy and paste this link into your browser:</p>
            
            <p style="margin-bottom: 20px; font-size: 14px; color: #666666; word-break: break-all;">
              <a href="${inviteUrl}" style="color: #4f46e5;">${inviteUrl}</a>
            </p>
            
            <p style="margin-top: 30px; font-size: 14px; color: #666666; border-top: 1px solid #e2e8f0; padding-top: 20px;">
              This invitation link will expire in 24 hours. If you need a new invitation, please contact your administrator.
            </p>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendUserInviteEmail(email: string, inviteToken: string) {
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/users/onboard?token=${inviteToken}`;

  return sendEmail({
    to: email,
    subject: "Complete Your Account Setup",
    text: `Click the following link to complete your account setup: ${inviteUrl}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Complete Your Account Setup</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
            <h1 style="color: #2d3748; margin-bottom: 20px; font-size: 24px;">Welcome to Your Account Setup</h1>
            
            <p style="margin-bottom: 20px;">Thank you for joining us! To complete your account setup, please click the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" 
                 style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Complete Account Setup
              </a>
            </div>
            
            <p style="margin-bottom: 20px; font-size: 14px; color: #666666;">If the button above doesn't work, you can also copy and paste this link into your browser:</p>
            
            <p style="margin-bottom: 20px; font-size: 14px; color: #666666; word-break: break-all;">
              <a href="${inviteUrl}" style="color: #4f46e5;">${inviteUrl}</a>
            </p>
          </div>
        </body>
      </html>
    `,
  });
}
