import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    feedbackRating: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    certificateId: {
      type: String,
      unique: true,
      sparse: true,
    },
    certificateUrl: {
      type: String,
      default: '',
    },
    submissionDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Student = mongoose.model('Student', studentSchema);
export default Student;
