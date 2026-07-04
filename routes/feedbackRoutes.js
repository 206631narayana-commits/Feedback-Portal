import express from 'express';
import { body } from 'express-validator';
import { createFeedback, deleteFeedback, getFeedback, getFeedbackById, updateFeedback } from '../controllers/feedbackController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('state').trim().notEmpty().withMessage('State is required'),
    body('email').isEmail().withMessage('Email should be valid'),
    body('feedbackRating').isInt({ min: 1, max: 10 }).withMessage('Rating must be between 1 and 10'),
  ],
  createFeedback
);

router.get('/', protect, getFeedback);
router.get('/:id', protect, getFeedbackById);
router.put('/:id', protect, updateFeedback);
router.delete('/:id', protect, deleteFeedback);

export default router;
