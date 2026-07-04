import nodemailer from 'nodemailer';
import sgTransport from 'nodemailer-sendgrid-transport';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("SENDGRID_API_KEY exists:", !!process.env.SENDGRID_API_KEY);

let transporter = null;

const createTransporter = () => {
  const sendgridKey = process.env.SENDGRID_API_KEY;
  const emailUser = process.env.EMAIL_USER;

  if (!sendgridKey || !emailUser) {
    console.warn('❌ SendGrid credentials are missing.');
    console.warn('SENDGRID_API_KEY:', sendgridKey ? 'SET' : 'MISSING');
    console.warn('EMAIL_USER:', emailUser ? 'SET' : 'MISSING');
    return null;
  }

  console.log('✅ Creating SendGrid transporter with:');
  console.log('📧 From Email:', emailUser);
  console.log('🔑 SendGrid API Key: ••••••' + (sendgridKey ? sendgridKey.slice(-8) : 'NONE'));

  return nodemailer.createTransport(
    sgTransport({
      auth: {
        api_key: sendgridKey,
      },
    })
  );
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
    console.warn('❌ Email transporter not available - credentials missing');
    return { sent: false, reason: 'missing credentials' };
  }

  // Verify PDF file exists before sending
  if (!fs.existsSync(filePath)) {
    console.error('❌ PDF file not found at path:', filePath);
    return { sent: false, reason: 'PDF file not found', path: filePath };
  }

  console.log('📧 Preparing email to:', student.email);
  console.log('📎 Attachment path:', filePath);
  console.log('📎 File exists:', fs.existsSync(filePath));
  console.log('📎 File size:', fs.statSync(filePath).size, 'bytes');

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
        path: filePath,
      },
    ],
  };

  try {
    console.log('🔗 Attempting to send via SendGrid...');
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully to:', student.email);
    console.log('📨 Message ID:', result.messageId);
    console.log('📊 Response:', result.response);
    return { sent: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Email sending error:', {
      to: student.email,
      code: error.code,
      message: error.message,
      fullError: error.toString(),
    });
    return { sent: false, reason: error.message, code: error.code };
  }
};

// Send email asynchronously without blocking response
export const sendCertificateEmailAsync = (student, filePath) => {
  console.log('⏳ Queuing email asynchronously for:', student.email);
  console.log('📧 Checking credentials:', {
    user: process.env.EMAIL_USER ? 'SET' : 'MISSING',
    key: process.env.SENDGRID_API_KEY ? 'SET' : 'MISSING',
  });

  // Add delay to ensure file is completely written
  setTimeout(async () => {
    try {
      console.log('🔄 Starting email send attempt for:', student.email);
      
      // Verify credentials are still available
      const apiKey = process.env.SENDGRID_API_KEY;
      const emailUser = process.env.EMAIL_USER;
      
      if (!apiKey || !emailUser) {
        console.error('❌ Email credentials missing during async send!');
        console.error('API_KEY:', apiKey ? 'present' : 'MISSING');
        console.error('EMAIL_USER:', emailUser ? 'present' : 'MISSING');
        return;
      }

      // Verify file still exists before sending
      if (!fs.existsSync(filePath)) {
        console.error('❌ PDF file not found during async send:', filePath);
        return;
      }

      console.log('✔️ Pre-flight checks passed, sending email...');
      const result = await sendCertificateEmail(student, filePath);
      
      if (result.sent) {
        console.log('✅ Async email delivered successfully to:', student.email);
        console.log('📨 Message ID:', result.messageId);
      } else {
        console.error('⚠️ Async email send failed:', result.reason);
      }
    } catch (error) {
      console.error('❌ Async email sending exception:', {
        email: student.email,
        error: error.message,
        stack: error.stack,
      });
    }
  }, 2000); // 2 seconds delay to ensure PDF is written
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
