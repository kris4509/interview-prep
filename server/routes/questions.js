const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { generateQuestions } = require('../utils/questionGen');
const { generateQuestionsFromJobDescription } = require('../utils/jobDescriptionGen');

// GET /api/questions?category=behavioral&role_tag=backend
router.get('/', authenticate, (req, res) => {
  const { category, role_tag, difficulty } = req.query;
  let sql = 'SELECT * FROM questions WHERE 1=1';
  const params = [];

  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (role_tag) {
    sql += ' AND role_tag = ?';
    params.push(role_tag);
  }
  if (difficulty) {
    sql += ' AND difficulty = ?';
    params.push(difficulty);
  }

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
});

// GET /api/questions/random?category=behavioral
router.get('/random', authenticate, (req, res) => {
  const { category, role_tag } = req.query;
  let sql = 'SELECT * FROM questions WHERE 1=1';
  const params = [];

  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (role_tag) {
    sql += ' AND role_tag = ?';
    params.push(role_tag);
  }

  sql += ' ORDER BY RAND() LIMIT 1';

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) return res.status(404).json({ error: 'No matching questions found' });
    res.json(results[0]);
  });
});

// POST /api/questions/generate
// body: { role_tag, count }
router.post('/generate', authenticate, async (req, res) => {
  const { role_tag, count } = req.body;

  if (!role_tag) {
    return res.status(400).json({ error: 'role_tag is required' });
  }

  try {
    const questions = await generateQuestions(role_tag, count || 5);

    if (questions.length === 0) {
      return res.status(502).json({ error: 'No valid questions were generated' });
    }

    const values = questions.map((q) => [q.text, q.category, role_tag, q.difficulty]);

    db.query(
      'INSERT INTO questions (text, category, role_tag, difficulty) VALUES ?',
      [values],
      (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error saving generated questions' });
        res.status(201).json({
          inserted: result.affectedRows,
          questions
        });
      }
    );
  } catch (err) {
    console.error('Error generating questions:', err);
    res.status(500).json({ error: 'Failed to generate questions' });
  }
});

// POST /api/questions/generate-from-jd
// body: { job_description, label, count }
// label is a short user-provided tag (e.g. "skyfalke_backend") used as the
// role_tag so these questions are grouped per job application and can be
// pulled back up later without needing a schema change.
router.post('/generate-from-jd', authenticate, async (req, res) => {
  const { job_description, label, count } = req.body;

  if (!job_description || job_description.trim().length < 30) {
    return res.status(400).json({ error: 'Please provide a fuller job description (at least a few sentences).' });
  }
  if (!label) {
    return res.status(400).json({ error: 'A short label for this job (e.g. "skyfalke_backend") is required' });
  }

  // Normalize the label into something safe for a tag: lowercase, no spaces
  const roleTag = `jd_${label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40)}`;

  try {
    const questions = await generateQuestionsFromJobDescription(job_description, count || 6);

    if (questions.length === 0) {
      return res.status(502).json({ error: 'No valid questions were generated' });
    }

    const values = questions.map((q) => [q.text, q.category, roleTag, q.difficulty]);

    db.query(
      'INSERT INTO questions (text, category, role_tag, difficulty) VALUES ?',
      [values],
      (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error saving generated questions' });
        res.status(201).json({
          inserted: result.affectedRows,
          role_tag: roleTag,
          questions
        });
      }
    );
  } catch (err) {
    console.error('Error generating questions from job description:', err);
    res.status(500).json({ error: 'Failed to generate questions from job description' });
  }
});

module.exports = router;