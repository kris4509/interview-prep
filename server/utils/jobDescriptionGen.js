const OpenAI = require('openai');

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1'
});

const VALID_CATEGORIES = ['behavioral', 'technical', 'system_design', 'curveball'];
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];

const JD_PROMPT = (jobDescription, count) => `You are an experienced technical interviewer. Read the job description below and generate ${count} realistic interview questions that would actually be asked for THIS specific role — based on the technologies, responsibilities, and seniority level mentioned in the posting. Don't write generic questions; tailor them to what's actually in the description.

Job description:
"""
${jobDescription}
"""

Respond with ONLY valid JSON, no markdown formatting, no preamble — an array matching this exact shape:

[
  {
    "text": "<the interview question>",
    "category": "<one of: behavioral, technical, system_design, curveball>",
    "difficulty": "<one of: easy, medium, hard>"
  }
]`;

async function generateQuestionsFromJobDescription(jobDescription, count = 6) {
  const response = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    max_tokens: 1800,
    messages: [{ role: 'user', content: JD_PROMPT(jobDescription, count) }]
  });

  const text = response.choices[0].message.content;
  const cleaned = text.replace(/```json|```/g, '').trim();
  const questions = JSON.parse(cleaned);

  return questions
    .filter((q) => q.text && typeof q.text === 'string')
    .map((q) => ({
      text: q.text.trim(),
      category: VALID_CATEGORIES.includes(q.category) ? q.category : 'behavioral',
      difficulty: VALID_DIFFICULTIES.includes(q.difficulty) ? q.difficulty : 'medium'
    }));
}

module.exports = { generateQuestionsFromJobDescription };