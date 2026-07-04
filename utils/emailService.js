import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS || process.env.MAIL_PASS;

  if (!user || !pass) {
    console.warn('Email credentials are missing. Skipping certificate email.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user,
      pass,
    },
  });
};

export const sendCertificateEmail = async (student, filePath) => {
  const transporter = createTransporter();
  if (!transporter) {
    return { sent: false, reason: 'missing credentials' };
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: student.email,
    subject: 'Participation Certificate - Event Feedback Submission',
    html: `
      <p>Hello ${student.name},</p>
      <p>Thank you for participating in our event.</p>
      <p>Your feedback has been successfully submitted.</p>
      <p>Please find your Participation Certificate attached.</p>
      <br />
      <p>Regards,<br/>Event Organizing Team</p>
    `,
    attachments: [
      {
        filename: `certificate-${student.certificateId || 'download'}.pdf`,
        path: path.resolve(filePath),
      },
    ],
  };

  await transporter.sendMail(mailOptions);
  return { sent: true };
};
