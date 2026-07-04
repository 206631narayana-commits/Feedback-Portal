// import nodemailer from 'nodemailer';
// import dotenv from 'dotenv';
// import path from 'path';
// import { fileURLToPath } from 'url';

// dotenv.config();

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// console.log("EMAIL_USER:", process.env.EMAIL_USER);
// console.log("EMAIL_PASS exists:", !!process.env.EMAIL_PASS);



// // const createTransporter = () => {
// //   const user = process.env.EMAIL_USER;
// //   const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS || process.env.MAIL_PASS;

// //   if (!user || !pass) {
// //     console.warn('Email credentials are missing. Skipping certificate email.');
// //     return null;
// //   }

// //   return nodemailer.createTransport({
// //     host: process.env.SMTP_HOST || 'smtp.gmail.com',
// //     port: Number(process.env.SMTP_PORT || 587),
// //     secure: process.env.SMTP_SECURE === 'true',
// //     auth: {
// //       user,
// //       pass,
// //     },
// //     connectionTimeout: 30000,
// //     greetingTimeout: 30000,
// //     socketTimeout: 30000,
// //   });
// // };

// export const sendCertificateEmail = async (student, filePath) => {
//   const transporter = createTransporter();
//   if (!transporter) {
//     return { sent: false, reason: 'missing credentials' };
//   }

//   const mailOptions = {
//     from: process.env.EMAIL_USER,
//     to: student.email,
//     subject: 'Participation Certificate - Event Feedback Submission',
//     html: `
//       <p>Hello ${student.name},</p>
//       <p>Thank you for participating in our event.</p>
//       <p>Your feedback has been successfully submitted.</p>
//       <p>Please find your Participation Certificate attached.</p>
//       <br />
//       <p>Regards,<br/>Event Organizing Team</p>
//     `,
//     attachments: [
//       {
//         filename: `certificate-${student.certificateId || 'download'}.pdf`,
//         path: path.resolve(filePath),
//       },
//     ],
//   };

//   await transporter.sendMail(mailOptions);
//   return { sent: true };
// };

import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const createTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.log("Email credentials missing");
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });
};

export const sendCertificateEmail = async (student, filePath) => {
  const transporter = createTransporter();

  if (!transporter) {
    return {
      sent: false,
      reason: "Missing email credentials",
    };
  }

  await transporter.verify();

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: student.email,
    subject: "Participation Certificate",
    html: `
      <h3>Hello ${student.name}</h3>
      <p>Thank you for your feedback.</p>
      <p>Your certificate is attached.</p>
    `,
    attachments: [
      {
        filename: `certificate-${student.certificateId}.pdf`,
        path: path.resolve(filePath),
      },
    ],
  });

  return {
    sent: true,
  };
};