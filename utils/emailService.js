import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS exists:", !!process.env.EMAIL_PASS);
console.log("SMTP_PORT:", process.env.SMTP_PORT || 587);
console.log("SMTP_SECURE:", process.env.SMTP_SECURE || 'false (TLS)');

let transporter = null;

const createTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS || process.env.MAIL_PASS;

  if (!user || !pass) {
    console.warn('Email credentials are missing. Skipping certificate email.');
    return null;
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const isSecure = port === 465; // Port 465 = SSL/implicit, 587 = TLS/explicit

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: port,
    secure: isSecure, // true for 465, false for 587 (TLS)
    auth: {
      user,
      pass,
    },
    // Render-friendly connection settings
    connectionTimeout: 60000, // Increased to 60 seconds
    greetingTimeout: 60000,
    socketTimeout: 60000,
    authTimeout: 10000,
    // Connection pooling for reuse
    pool: {
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 4000,
      rateLimit: 14,
    },
    // Keep alive for persistent connections
    tls: {
      rejectUnauthorized: false, // For development/Render compatibility
    },
  });
};

// Get or create transporter (reuse connection)
const getTransporter = () => {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
};

export const sendCertificateEmail = async (student, filePath) => {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('Email transporter not available - credentials missing');
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

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { sent: true };
  } catch (error) {
    console.error('Email sending error:', {
      code: error.code,
      message: error.message,
      command: error.command,
    });
    return { sent: false, reason: error.message, code: error.code };
  }
};

// Send email asynchronously without blocking response
export const sendCertificateEmailAsync = (student, filePath) => {
  setImmediate(async () => {
    try {
      await sendCertificateEmail(student, filePath);
    } catch (error) {
      console.error('Async email sending failed:', error.message);
    }
  });
};

// import nodemailer from "nodemailer";
// import dotenv from "dotenv";
// import path from "path";

// dotenv.config();

// const createTransporter = () => {
//   const user = process.env.EMAIL_USER;
//   const pass = process.env.EMAIL_PASS;

//   if (!user || !pass) {
//     console.log("Email credentials missing");
//     return null;
//   }

//   return nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user,
//       pass,
//     },
//   });
// };

// export const sendCertificateEmail = async (student, filePath) => {
//   const transporter = createTransporter();

//   if (!transporter) {
//     return {
//       sent: false,
//       reason: "Missing email credentials",
//     };
//   }

//   await transporter.verify();

//   await transporter.sendMail({
//     from: process.env.EMAIL_USER,
//     to: student.email,
//     subject: "Participation Certificate",
//     html: `
//       <h3>Hello ${student.name}</h3>
//       <p>Thank you for your feedback.</p>
//       <p>Your certificate is attached.</p>
//     `,
//     attachments: [
//       {
//         filename: `certificate-${student.certificateId}.pdf`,
//         path: path.resolve(filePath),
//       },
//     ],
//   });
//   try {
//   await transporter.verify();
//   console.log("SMTP verified successfully");
// } catch (err) {
//   console.error("SMTP verify failed:", err);
//   throw err;
// }

//   return {
//     sent: true,
//   };
// };
