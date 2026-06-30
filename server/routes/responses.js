const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { generateFeedback } = require('../utils/feedback');

// POST /api/responses
// JSON body: { session_id, question_id, transcript_text, duration_seconds }
// Transcript is produced client-side by the browser's Web Speech API (free),
// so no audio file ever needs to hit the server.
router.post('/', authenticate, async (req, res) => {
  const { session_id, question_id, transcript_text, duration_seconds } = req.body;

  if (!session_id || !question_id || !transcript_text) {
    return res.status(400).json({ error: 'session_id, question_id, and transcript_text are required' });
  }

  try {
    // 1. Look up the question text (needed for the feedback prompt)
    const question = await new Promise((resolve, reject) => {
      db.query('SELECT text FROM questions WHERE id = ?', [question_id], (err, results) => {
        if (err) return reject(err);
        resolve(results[0]);
      });
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // 2. Save the response record
    const responseId = await new Promise((resolve, reject) => {
      db.query(
        'INSERT INTO responses (session_id, question_id, transcript_text, duration_seconds) VALUES (?, ?, ?, ?)',
        [session_id, question_id, transcript_text, duration_seconds || null],
        (err, result) => {
          if (err) return reject(err);
          resolve(result.insertId);
        }
      );
    });

    // 3. Generate feedback via Groq (free tier)
    const feedback = await generateFeedback(question.text, transcript_text);

    // 4. Save feedback
    await new Promise((resolve, reject) => {
      db.query(
        `INSERT INTO feedback_results
         (response_id, star_structure_score, specificity_score, filler_word_count, pacing_notes, content_gap_notes, suggested_rewrite, raw_llm_output)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          responseId,
          feedback.star_structure_score,
          feedback.specificity_score,
          feedback.filler_word_count,
          feedback.pacing_notes,
          feedback.content_gap_notes,
          feedback.suggested_rewrite,
          JSON.stringify(feedback)
        ],
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });

    res.status(201).json({
      response_id: responseId,
      transcript: transcript_text,
      feedback
    });
  } catch (err) {
    console.error('Error processing response:', err);
    res.status(500).json({ error: 'Failed to process response' });
  }
});

module.exports = router;