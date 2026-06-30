// Generates realistic, commonly-asked interview questions for a given role
// using Groq's free-tier API — same setup as feedback.js.
const OpenAI = require('openai');

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1'
});

const VALID_CATEGORIES = ['behavioral', 'technical', 'system_design', 'curveball'];
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];

const QUESTION_GEN_PROMPT = (role, count) => `You are an experienced technical interviewer. Generate ${count} realistic interview questions that are commonly asked for a "${role}" software engineering role in real job interviews today. Mix question types — include a blend of behavioral and technical questions, and a system design question if relevant to the role.

Respond with ONLY valid JSON, no markdown formatting, no preamble — an array matching this exact shape:

[
  {
    "text": "<the interview question>",
    "category": "<one of: behavioral, technical, system_design, curveball>",
    "difficulty": "<one of: easy, medium, hard>"
  }
]

Make sure the questions are genuinely common ones asked in real interviews for this role, not generic filler.`;

async function generateQuestions(role, count = 5) {
  const response = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    max_tokens: 1500,
    messages: [{ role: 'user', content: QUESTION_GEN_PROMPT(role, count) }]
  });

  const text = response.choices[0].message.content;
  const cleaned = text.replace(/```json|```/g, '').trim();
  const questions = JSON.parse(cleaned);

  // Validate and sanitize each generated question before it ever touches the DB —
  // small models occasionally produce an invalid category/difficulty value.
  return questions
    .filter((q) => q.text && typeof q.text === 'string')
    .map((q) => ({
      text: q.text.trim(),
      category: VALID_CATEGORIES.includes(q.category) ? q.category : 'behavioral',
      difficulty: VALID_DIFFICULTIES.includes(q.difficulty) ? q.difficulty : 'medium'
    }));
}

module.exports = { generateQuestions };