import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("SENDGRID_API_KEY exists:", !!process.env.SENDGRID_API_KEY);

// Initialize SendGrid with API key
const initializeSendGrid = () => {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (apiKey) {
    sgMail.setApiKey(apiKey);
    console.log('✅ SendGrid initialized with API key');
  } else {
    console.warn('❌ SENDGRID_API_KEY not found in environment');
  }
};

initializeSendGrid();

export const sendCertificateEmail = async (student, filePath) => {
  const apiKey = process.env.SENDGRID_API_KEY;
  const emailUser = process.env.EMAIL_USER;

  if (!apiKey || !emailUser) {
    console.warn('❌ SendGrid credentials are missing');
    console.warn('SENDGRID_API_KEY:', apiKey ? 'SET' : 'MISSING');
    console.warn('EMAIL_USER:', emailUser ? 'SET' : 'MISSING');
    return { sent: false, reason: 'missing credentials' };
  }

  // Verify PDF file exists before sending
  if (!fs.existsSync(filePath)) {
    console.error('❌ PDF file not found at path:', filePath);
    return { sent: false, reason: 'PDF file not found', path: filePath };
  }

  const fileSize = fs.statSync(filePath).size;
  console.log('📧 Preparing email to:', student.email);
  console.log('📎 Attachment path:', filePath);
  console.log('📎 File exists: true');
  console.log('📎 File size:', fileSize, 'bytes');

  try {
    // Read PDF file and convert to base64
    const pdfData = fs.readFileSync(filePath);
    const base64PDF = pdfData.toString('base64');

    const msg = {
      to: student.email,
      from: emailUser, // Must be a verified sender in SendGrid
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
          content: base64PDF,
          filename: `certificate-${student.certificateId || 'download'}.pdf`,
          type: 'application/pdf',
          disposition: 'attachment',
        },
      ],
    };

    console.log('🔗 Sending via SendGrid API...');
    const result = await sgMail.send(msg);
    
    console.log('✅ Email sent successfully to:', student.email);
    console.log('📨 Message ID:', result[0].headers['x-message-id']);
    console.log('📊 Status Code:', result[0].statusCode);
    
    return { sent: true, messageId: result[0].headers['x-message-id'] };
  } catch (error) {
    console.error('❌ Email sending error:', {
      to: student.email,
      code: error.code,
      message: error.message,
      response: error.response?.body || error.response,
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
