const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

// POST /api/sessions - start a new practice session
router.post('/', authenticate, (req, res) => {
  const { title, mode } = req.body;
  const userId = req.user.id;

  db.query(
    'INSERT INTO sessions (user_id, title, mode) VALUES (?, ?, ?)',
    [userId, title || 'Practice session', mode || 'online'],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.status(201).json({ id: result.insertId, user_id: userId, title, mode });
    }
  );
});

// PUT /api/sessions/:id/end - mark session as ended
router.put('/:id/end', authenticate, (req, res) => {
  db.query(
    'UPDATE sessions SET ended_at = NOW() WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Session not found' });
      res.json({ message: 'Session ended' });
    }
  );
});

// GET /api/sessions - list this user's sessions
router.get('/', authenticate, (req, res) => {
  db.query(
    'SELECT * FROM sessions WHERE user_id = ? ORDER BY started_at DESC',
    [req.user.id],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(results);
    }
  );
});

// GET /api/sessions/:id - get session detail with responses + feedback
router.get('/:id', authenticate, (req, res) => {
  const sessionId = req.params.id;

  db.query(
    'SELECT * FROM sessions WHERE id = ? AND user_id = ?',
    [sessionId, req.user.id],
    (err, sessionResults) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (sessionResults.length === 0) return res.status(404).json({ error: 'Session not found' });

      const sql = `
        SELECT r.*, q.text AS question_text, q.category,
               f.star_structure_score, f.specificity_score, f.filler_word_count,
               f.pacing_notes, f.content_gap_notes, f.suggested_rewrite
        FROM responses r
        JOIN questions q ON r.question_id = q.id
        LEFT JOIN feedback_results f ON f.response_id = r.id
        WHERE r.session_id = ?
        ORDER BY r.created_at ASC
      `;

      db.query(sql, [sessionId], (err, responseResults) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ session: sessionResults[0], responses: responseResults });
      });
    }
  );
});

module.exports = router;