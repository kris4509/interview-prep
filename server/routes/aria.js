const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  generateIntroduction,
  generateSpokenFeedback,
  generateClosingSummary
} = require('../utils/ariaAgent');

// POST /api/aria/introduction
// body: { job_label }
// Called once at the start of each interview session
router.post('/introduction', authenticate, async (req, res) => {
  const { job_label } = req.body;

  if (!job_label) {
    return res.status(400).json({ error: 'job_label is required' });
  }

  try {
    const introduction = await generateIntroduction(job_label);
    res.json({ introduction });
  } catch (err) {
    console.error('Error generating introduction:', err);
    res.status(500).json({ error: 'Failed to generate introduction' });
  }
});

// POST /api/aria/spoken-feedback
// body: { question_text, transcript, full_feedback }
// Called after each answer — generates Aria's short verbal response
router.post('/spoken-feedback', authenticate, async (req, res) => {
  const { question_text, transcript, full_feedback } = req.body;

  if (!question_text || !transcript || !full_feedback) {
    return res.status(400).json({ error: 'question_text, transcript, and full_feedback are required' });
  }

  try {
    const spoken = await generateSpokenFeedback(question_text, transcript, full_feedback);
    res.json({ spoken });
  } catch (err) {
    console.error('Error generating spoken feedback:', err);
    res.status(500).json({ error: 'Failed to generate spoken feedback' });
  }
});

// POST /api/aria/closing-summary
// body: { responses }
// Called at the end of the session with all responses + scores
router.post('/closing-summary', authenticate, async (req, res) => {
  const { responses } = req.body;

  if (!responses || responses.length === 0) {
    return res.status(400).json({ error: 'responses array is required' });
  }

  try {
    const summary = await generateClosingSummary(responses);
    res.json({ summary });
  } catch (err) {
    console.error('Error generating closing summary:', err);
    res.status(500).json({ error: 'Failed to generate closing summary' });
  }
});

module.exports = router;