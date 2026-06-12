import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

function hasSmtpConfig() {
  return Boolean(env.smtpHost && env.smtpUser && env.smtpPass);
}

function createTransporter() {
  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass
    }
  });
}

export async function sendMail({ to, subject, html, text }) {
  if (!hasSmtpConfig()) {
    console.log('SMTP not configured. Email preview:', { to, subject, text });
    return { preview: true };
  }

  const transporter = createTransporter();
  return transporter.sendMail({
    from: env.smtpFrom,
    to,
    subject,
    html,
    text
  });
}
