const OpenAI = require('openai');

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1'
});

// Generates Aria's spoken introduction at the start of an interview
async function generateIntroduction(jobLabel) {
  const response = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    max_tokens: 150,
    messages: [
      {
        role: 'user',
        content: `You are Aria, a professional and friendly AI interviewer. Generate a natural, warm 2-3 sentence introduction for an interview for the role: "${jobLabel}". 
        
        Start with "Hi, I'm Aria" and mention you've reviewed the job description and are ready to begin. Keep it concise and professional. Do NOT include any formatting, just plain conversational text.`
      }
    ]
  });

  return response.choices[0].message.content.trim();
}

// Generates Aria's brief spoken feedback after each answer
// before moving to the next question
async function generateSpokenFeedback(questionText, transcript, fullFeedback) {
  const response = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    max_tokens: 120,
    messages: [
      {
        role: 'user',
        content: `You are Aria, a professional AI interviewer giving brief verbal feedback after a candidate's answer. 

Question: "${questionText}"
Candidate's answer: "${transcript}"
Structure score: ${fullFeedback.star_structure_score}/5
Specificity score: ${fullFeedback.specificity_score}/5
Key gap: ${fullFeedback.content_gap_notes}

Generate a 1-2 sentence spoken response that:
- Acknowledges the answer briefly (positive or constructive)
- Mentions the single most important thing to improve
- Ends naturally so the interview can continue

Keep it conversational, like a real interviewer speaking. No formatting, plain text only.`
      }
    ]
  });

  return response.choices[0].message.content.trim();
}

// Generates Aria's closing summary after all questions are done
async function generateClosingSummary(responses) {
  const summaryInput = responses.map((r, i) =>
    `Q${i + 1}: ${r.question_text}\nScore: Structure ${r.star_structure_score}/5, Specificity ${r.specificity_score}/5`
  ).join('\n\n');

  const response = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: `You are Aria, a professional AI interviewer wrapping up an interview. Based on these question scores:

${summaryInput}

Generate a warm, honest 3-4 sentence closing summary that:
- Thanks the candidate for their time
- Highlights their strongest area
- Mentions the single biggest area to work on
- Ends encouragingly

Keep it conversational, like a real interviewer. No formatting, plain text only.`
      }
    ]
  });

  return response.choices[0].message.content.trim();
}

module.exports = { generateIntroduction, generateSpokenFeedback, generateClosingSummary };