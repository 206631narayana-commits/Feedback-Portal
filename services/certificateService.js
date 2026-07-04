import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const generateCertificate = async (student) => {
  const certificateId = uuidv4();
  const fileName = `${certificateId}.pdf`;
  const filePath = path.join(uploadsDir, fileName);

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  doc.rect(20, 20, 555, 760).stroke('#0f766e');
  doc.rect(35, 35, 525, 730).stroke('#14b8a6');

  doc.fontSize(24).fillColor('#0f766e').text('Participation Certificate', 140, 70, { align: 'center' });
  doc.fontSize(14).fillColor('#374151').text('Event Feedback Submission', 140, 110, { align: 'center' });

  doc.fontSize(12).fillColor('#111827').text(`Certificate ID: ${certificateId}`, 70, 160);
  doc.fontSize(12).fillColor('#111827').text(`Date: ${new Date().toLocaleDateString()}`, 70, 185);

  doc.fontSize(20).fillColor('#111827').text(`This is to certify that`, 70, 240);
  doc.fontSize(28).fillColor('#0f766e').text(student.name.toUpperCase(), 70, 280, { underline: true });
  doc.fontSize(16).fillColor('#111827').text(`from ${student.state}`, 70, 330);
  doc.fontSize(16).fillColor('#111827').text('has successfully participated in our event and submitted feedback.', 70, 370);
  doc.fontSize(16).fillColor('#111827').text(`Feedback Rating: ${student.feedbackRating}/10`, 70, 410);

  doc.fontSize(14).fillColor('#6b7280').text('We appreciate your participation and valuable feedback.', 70, 470);

  doc.moveTo(70, 620).lineTo(250, 620).stroke('#111827');
  doc.fontSize(12).fillColor('#111827').text('Event Organizing Team', 70, 635);

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  return { certificateId, filePath };
};
