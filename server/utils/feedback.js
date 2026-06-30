// Using Groq's free-tier API — OpenAI-compatible endpoint, so we use the
// openai SDK pointed at Groq's base URL instead of OpenAI's.
const OpenAI = require('openai');

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1'
});

const FEEDBACK_PROMPT = (questionText, transcript) => `You are an interview coach reviewing a practice answer. Be honest and specific — this is for the candidate's own improvement, not to make them feel good.

Question asked: "${questionText}"

Candidate's answer (transcribed from speech):
"${transcript}"

Evaluate the answer and respond with ONLY valid JSON, no markdown formatting, no preamble, matching this exact shape:

{
  "star_structure_score": <1-5, how well the answer follows Situation/Task/Action/Result structure, or has clear logical structure for technical questions>,
  "specificity_score": <1-5, does the answer use concrete details, numbers, specific decisions, vs vague generalities>,
  "filler_word_count": <integer, count of "um", "uh", "like", "you know", "kind of" etc in the transcript>,
  "pacing_notes": "<1-2 sentences on pacing/conciseness — too rushed, too rambling, just right>",
  "content_gap_notes": "<1-2 sentences on what's missing or unaddressed from the question>",
  "suggested_rewrite": "<a tightened 3-5 sentence version of their answer that keeps their actual content but improves structure and specificity>"
}`;

async function generateFeedback(questionText, transcript) {
  // llama-3.1-8b-instant is free on Groq and fast; swap to a larger free
  // model (e.g. llama-3.3-70b-versatile) if you want better quality at
  // the cost of slightly slower responses — still free either way.
  const response = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    max_tokens: 1000,
    messages: [{ role: 'user', content: FEEDBACK_PROMPT(questionText, transcript) }]
  });

  const text = response.choices[0].message.content;
  const cleaned = text.replace(/```json|```/g, '').trim();

  return JSON.parse(cleaned);
}

module.exports = { generateFeedback };