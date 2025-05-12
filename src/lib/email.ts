import sgMail from "@sendgrid/mail";

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("Missing SENDGRID_API_KEY environment variable");
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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
    await sgMail.send({
      to,
      from: process.env.SENDGRID_FROM_EMAIL || "noreply@example.com",
      subject,
      text,
      html: html || text,
    });
    return true;
  } catch (error) {
    console.error("SendGrid error:", error);
    return false;
  }
}

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

  return sendEmail({
    to: email,
    subject: "Reset Your Password",
    text: `Click the following link to reset your password: ${resetUrl}`,
    html: `
      <p>Click the following link to reset your password:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
    `,
  });
}

export async function sendAgencyInviteEmail(
  email: string,
  inviteToken: string
) {
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/agency/onboard?token=${inviteToken}`;

  return sendEmail({
    to: email,
    subject: "Complete Your Agency Onboarding",
    text: `Click the following link to complete your agency onboarding: ${inviteUrl}`,
    html: `
      <p>Click the following link to complete your agency onboarding:</p>
      <p><a href="${inviteUrl}">${inviteUrl}</a></p>
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
      <p>Click the following link to complete your account setup:</p>
      <p><a href="${inviteUrl}">${inviteUrl}</a></p>
    `,
  });
}
