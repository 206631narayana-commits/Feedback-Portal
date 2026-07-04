import Student from '../models/studentModel.js';
import { generateCertificate } from '../services/certificateService.js';
import { sendCertificateEmailAsync } from '../utils/emailService.js';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Admin from '../models/adminModel.js';
import { createStudentRecord, createAdminRecord, deleteStudentById, findAdminByEmail, findStudentByEmail, getStudentById, listStudents, updateStudentById } from '../utils/fallbackStore.js';

export const createFeedback = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const email = req.body.email.toLowerCase();
    let existingStudent = null;

    try {
      existingStudent = await Student.findOne({ email });
    } catch (dbError) {
      existingStudent = await findStudentByEmail(email);
    }

    if (existingStudent) {
      return res.status(409).json({ message: 'A submission with this email already exists.' });
    }

    const studentData = {
      name: req.body.name,
      state: req.body.state,
      email,
      feedbackRating: req.body.feedbackRating,
    };

    let savedStudent;
    try {
      const student = new Student(studentData);
      savedStudent = await student.save();
    } catch (dbError) {
      savedStudent = await createStudentRecord(studentData);
    }

    const { certificateId, filePath } = await generateCertificate(savedStudent);

    savedStudent.certificateId = certificateId;
    savedStudent.certificateUrl = `/uploads/${certificateId}.pdf`;

    try {
      await savedStudent.save();
    } catch (saveError) {
      savedStudent = await updateStudentById(savedStudent._id, {
        certificateId,
        certificateUrl: savedStudent.certificateUrl,
      });
    }

    let emailResult = { sent: false, reason: 'not-attempted' };
    // Send email asynchronously (non-blocking)
    try {
      sendCertificateEmailAsync(savedStudent, filePath);
      emailResult = { sent: true, async: true, message: 'Email queued for sending' };
    } catch (emailErr) {
      console.error('Email queue failed:', emailErr);
      emailResult = { sent: false, reason: emailErr.message };
    }

    res.status(201).json({
      message: 'Feedback submitted successfully',
      student: savedStudent,
      certificateUrl: savedStudent.certificateUrl,
      email: emailResult,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit feedback', error: error.message });
  }
};

export const getFeedback = async (req, res) => {
  try {
    let students = [];
    try {
      students = await Student.find().sort({ createdAt: -1 });
    } catch (error) {
      students = await listStudents();
    }
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch feedback', error: error.message });
  }
};

export const getFeedbackById = async (req, res) => {
  try {
    let student = null;
    try {
      student = await Student.findById(req.params.id);
    } catch (error) {
      student = await getStudentById(req.params.id);
    }
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch student', error: error.message });
  }
};

export const updateFeedback = async (req, res) => {
  try {
    let student = null;
    try {
      student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    } catch (error) {
      student = await updateStudentById(req.params.id, req.body);
    }
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update student', error: error.message });
  }
};

export const deleteFeedback = async (req, res) => {
  try {
    let student = null;
    try {
      student = await Student.findByIdAndDelete(req.params.id);
    } catch (error) {
      student = await deleteStudentById(req.params.id);
    }
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete student', error: error.message });
  }
};

export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  try {
    let admin = null;
    try {
      admin = await Admin.findOne({ email });
    } catch (error) {
      admin = await findAdminByEmail(email);
    }
    if (!admin) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: admin._id, email: admin.email }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '1d',
    });

    res.json({ token, admin: { email: admin.email } });
  } catch (error) {
    res.status(500).json({ message: 'Admin login failed', error: error.message });
  }
};

export const seedAdmin = async () => {
  try {
    const existing = await Admin.findOne({ email: 'admin@example.com' });
    if (!existing) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await Admin.create({ email: 'admin@example.com', password: hashedPassword });
    }
  } catch (error) {
    const existing = await findAdminByEmail('admin@example.com');
    if (!existing) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await createAdminRecord({ email: 'admin@example.com', password: hashedPassword });
    }
  }
};

// Test email endpoint - for debugging email credentials
export const testEmail = async (req, res) => {
  const { recipientEmail } = req.body;

  if (!recipientEmail) {
    return res.status(400).json({ message: 'recipientEmail is required' });
  }

  try {
    console.log('\n🧪 ===== TEST EMAIL START =====');
    console.log('🔍 Checking environment variables...');
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✅ SET' : '❌ MISSING');
    console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? '✅ SET' : '❌ MISSING');

    const sendgridKey = process.env.SENDGRID_API_KEY;
    const emailUser = process.env.EMAIL_USER;

    if (!sendgridKey || !emailUser) {
      console.error('❌ SendGrid credentials not configured!');
      return res.status(400).json({ 
        message: 'SendGrid credentials not configured in environment',
        details: {
          SENDGRID_API_KEY: sendgridKey ? 'present' : 'MISSING',
          EMAIL_USER: emailUser ? 'present' : 'MISSING'
        }
      });
    }

    const nodemailer = (await import('nodemailer')).default;
    const sgTransport = (await import('nodemailer-sendgrid-transport')).default;

    console.log('\n🔗 Creating SendGrid transporter...');
    console.log('From Email:', emailUser);
    console.log('API Key: ••••••' + sendgridKey.slice(-8));

    const transporter = nodemailer.createTransport(
      sgTransport({
        auth: {
          api_key: sendgridKey,
        },
      })
    );

    console.log('✅ Transporter created, attempting to verify connection...');
    
    // Verify SendGrid connection
    await transporter.verify();
    console.log('✅ SendGrid connection verified successfully!');

    console.log('\n📧 Sending test email to:', recipientEmail);
    
    const mailOptions = {
      from: emailUser,
      to: recipientEmail,
      subject: '🧪 Test Email - Certificate Portal',
      html: `
        <h2>✅ Email Test Successful!</h2>
        <p>If you received this, your SendGrid email configuration is working correctly.</p>
        <p><strong>Sender:</strong> ${emailUser}</p>
        <p><strong>Service:</strong> SendGrid</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('Response:', result.response);
    console.log('🧪 ===== TEST EMAIL END =====\n');
    
    res.json({ 
      message: 'Test email sent successfully!',
      messageId: result.messageId,
      recipientEmail,
      status: 'SUCCESS',
    });
  } catch (error) {
    console.error('\n❌ Test email error:', {
      message: error.message,
      code: error.code,
      fullError: error.toString(),
      stack: error.stack,
    });
    console.error('🧪 ===== TEST EMAIL FAILED =====\n');
    
    res.status(500).json({ 
      message: 'Test email failed',
      error: error.message,
      code: error.code,
      details: error.toString(),
      status: 'FAILED',
    });
  }
};
