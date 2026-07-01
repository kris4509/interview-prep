import React, { useState, useRef, useEffect } from 'react';
import api from '../api/client';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useAria } from '../hooks/useAria';

const card = { backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '12px' };
const cyan = '#06b6d4';
const textPrimary = '#e6edf3';
const textMuted = '#8b949e';

// Interview stages
const STAGE = {
  SETUP: 'setup',           // JD paste screen
  INTRO: 'intro',           // Aria introducing herself
  QUESTION: 'question',     // Aria asking a question
  LISTENING: 'listening',   // User answering
  PROCESSING: 'processing', // Generating feedback
  FEEDBACK: 'feedback',     // Aria giving spoken feedback
  FINISHED: 'finished'      // Closing summary
};

export default function AriaInterview() {
  const [stage, setStage] = useState(STAGE.SETUP);
  const [jdText, setJdText] = useState('');
  const [jdLabel, setJdLabel] = useState('');
  const [jdError, setJdError] = useState(null);
  const [jdSubmitting, setJdSubmitting] = useState(false);

  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState([]);
  const [currentFeedback, setCurrentFeedback] = useState(null);
  const [ariaText, setAriaText] = useState('');
  const [closingSummary, setClosingSummary] = useState(null);

  const startTimeRef = useRef(null);
  const { speak, stop } = useAria();
  const {
    transcript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition();

  // When stage changes to QUESTION, Aria speaks the question
  useEffect(() => {
    if (stage === STAGE.QUESTION && questions[currentIndex]) {
      const question = questions[currentIndex];
      const text = `Question ${currentIndex + 1}. ${question.text}`;
      setAriaText(text);
      speak(text);
    }
  }, [stage, currentIndex]);

  async function handleStartInterview() {
    if (jdText.trim().length < 30) {
      setJdError('Please paste a fuller job description.');
      return;
    }
    if (!jdLabel.trim()) {
      setJdError('Give this job a short label first.');
      return;
    }

    setJdSubmitting(true);
    setJdError(null);

    try {
      // Generate questions from JD
      const { data: genData } = await api.post('/questions/generate-from-jd', {
        job_description: jdText.trim(),
        label: jdLabel.trim(),
        count: 5
      });

      // Fetch the generated questions
      const { data: questionData } = await api.get('/questions', {
        params: { role_tag: genData.role_tag }
      });
      setQuestions(questionData.slice(0, 5));

      // Start a session
      const { data: session } = await api.post('/sessions', {
        title: `Aria Interview — ${jdLabel.trim()}`,
        mode: 'online'
      });
      setSessionId(session.id);

      // Get Aria's introduction
      setStage(STAGE.INTRO);
      const { data: introData } = await api.post('/aria/introduction', {
        job_label: jdLabel.trim()
      });

      setAriaText(introData.introduction);
      speak(introData.introduction, () => {
        // After intro, move to first question
        setCurrentIndex(0);
        setStage(STAGE.QUESTION);
      });
    } catch (err) {
      setJdError('Failed to start interview. Please try again.');
      console.error(err);
    } finally {
      setJdSubmitting(false);
    }
  }

  function handleStartAnswer() {
    stop(); // stop Aria speaking if still going
    startTimeRef.current = Date.now();
    resetTranscript();
    startListening();
    setStage(STAGE.LISTENING);
  }

  async function handleStopAnswer() {
    stopListening();
    const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);

    if (!transcript.trim()) {
      setStage(STAGE.QUESTION);
      return;
    }

    setStage(STAGE.PROCESSING);
    const question = questions[currentIndex];

    try {
      // Save response + get full feedback
      const { data: responseData } = await api.post('/responses', {
        session_id: sessionId,
        question_id: question.id,
        transcript_text: transcript.trim(),
        duration_seconds: durationSeconds
      });

      setCurrentFeedback(responseData.feedback);

      // Get Aria's short spoken feedback
      const { data: spokenData } = await api.post('/aria/spoken-feedback', {
        question_text: question.text,
        transcript: transcript.trim(),
        full_feedback: responseData.feedback
      });

      // Save response for closing summary
      setResponses(prev => [...prev, {
        question_text: question.text,
        transcript: transcript.trim(),
        star_structure_score: responseData.feedback.star_structure_score,
        specificity_score: responseData.feedback.specificity_score
      }]);

      setAriaText(spokenData.spoken);
      setStage(STAGE.FEEDBACK);

      speak(spokenData.spoken, () => {
        // After spoken feedback, move to next question or finish
        const nextIndex = currentIndex + 1;
        if (nextIndex < questions.length) {
          setCurrentIndex(nextIndex);
          setCurrentFeedback(null);
          setStage(STAGE.QUESTION);
        } else {
          handleFinishInterview();
        }
      });
    } catch (err) {
      console.error(err);
      setStage(STAGE.QUESTION);
    }
  }

  async function handleFinishInterview() {
    setStage(STAGE.FINISHED);
    try {
      const { data } = await api.post('/aria/closing-summary', {
        responses: responses
      });
      setClosingSummary(data.summary);
      setAriaText(data.summary);
      speak(data.summary);
    } catch (err) {
      console.error(err);
      setClosingSummary('Thank you for completing the interview. Review your session in the History tab.');
    }
  }

  // ─── SETUP SCREEN ───────────────────────────────────────────────
  if (stage === STAGE.SETUP) {
    return (
      <div className="max-w-xl mx-auto px-4 mt-8 pb-20">
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-3"
            style={{ backgroundColor: '#161b22', border: `2px solid ${cyan}` }}
          >
            🎙️
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: textPrimary }}>
            Meet Aria
          </h1>
          <p className="text-sm" style={{ color: textMuted }}>
            Your AI interviewer — paste a job description and Aria will conduct a real interview with you
          </p>
        </div>

        <div style={card} className="p-5">
          <input
            type="text"
            placeholder='Short label, e.g. "safaricom_procurement" or "knh_nurse"'
            value={jdLabel}
            onChange={(e) => setJdLabel(e.target.value)}
            className="w-full rounded-lg px-3 py-2.5 text-sm mb-2 outline-none"
            style={{ backgroundColor: '#0d1117', border: '1px solid #30363d', color: textPrimary }}
          />
          <textarea
            placeholder="Paste the full job description here..."
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            rows={6}
            className="w-full rounded-lg px-3 py-2.5 text-sm mb-3 outline-none resize-none"
            style={{ backgroundColor: '#0d1117', border: '1px solid #30363d', color: textPrimary }}
          />
          {jdError && <p className="text-xs mb-2" style={{ color: '#f85149' }}>{jdError}</p>}
          <button
            onClick={handleStartInterview}
            disabled={jdSubmitting}
            className="w-full py-2.5 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: cyan, color: '#0d1117', opacity: jdSubmitting ? 0.6 : 1 }}
          >
            {jdSubmitting ? 'Preparing your interview...' : '🎙️ Start Interview with Aria'}
          </button>
        </div>

        {!isSupported && (
          <p className="text-xs text-center mt-4" style={{ color: '#f85149' }}>
            ⚠️ Please use Chrome or Edge for voice features
          </p>
        )}
      </div>
    );
  }

  // ─── FINISHED SCREEN ────────────────────────────────────────────
  if (stage === STAGE.FINISHED) {
    return (
      <div className="max-w-xl mx-auto px-4 mt-8 pb-20">
        <div className="text-center mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-3"
            style={{ backgroundColor: '#161b22', border: `2px solid #3fb950` }}
          >
            ✓
          </div>
          <h1 className="text-xl font-bold mb-1" style={{ color: textPrimary }}>Interview Complete</h1>
          <p className="text-sm" style={{ color: textMuted }}>Aria's closing summary</p>
        </div>

        <div style={card} className="p-5 mb-4">
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5"
              style={{ backgroundColor: '#0d1117', border: `1px solid ${cyan}`, color: cyan }}
            >
              A
            </div>
            <p className="text-sm leading-relaxed" style={{ color: textPrimary }}>
              {closingSummary || 'Generating summary...'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {responses.map((r, i) => (
            <div key={i} style={{ ...card }} className="p-3">
              <p className="text-xs mb-2 truncate" style={{ color: textMuted }}>Q{i + 1}: {r.question_text}</p>
              <div className="flex gap-3">
                <div>
                  <p className="text-lg font-bold" style={{ color: r.star_structure_score >= 4 ? '#3fb950' : r.star_structure_score >= 3 ? '#d29922' : '#f85149' }}>
                    {r.star_structure_score}/5
                  </p>
                  <p className="text-xs" style={{ color: textMuted }}>Structure</p>
                </div>
                <div>
                  <p className="text-lg font-bold" style={{ color: r.specificity_score >= 4 ? '#3fb950' : r.specificity_score >= 3 ? '#d29922' : '#f85149' }}>
                    {r.specificity_score}/5
                  </p>
                  <p className="text-xs" style={{ color: textMuted }}>Specificity</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            stop();
            setStage(STAGE.SETUP);
            setQuestions([]);
            setResponses([]);
            setCurrentIndex(0);
            setCurrentFeedback(null);
            setJdText('');
            setJdLabel('');
          }}
          className="w-full py-2.5 rounded-lg text-sm font-medium"
          style={{ backgroundColor: cyan, color: '#0d1117' }}
        >
          Start Another Interview
        </button>
      </div>
    );
  }

  // ─── INTERVIEW SCREEN (intro, question, listening, processing, feedback) ──
  const question = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex) / questions.length) * 100 : 0;

  return (
    <div className="max-w-xl mx-auto px-4 mt-8 pb-20">

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs" style={{ color: textMuted }}>
            {stage === STAGE.INTRO ? 'Introduction' : `Question ${currentIndex + 1} of ${questions.length}`}
          </span>
          <span className="text-xs" style={{ color: textMuted }}>{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-1 rounded-full" style={{ backgroundColor: '#30363d' }}>
          <div
            className="h-1 rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: cyan }}
          />
        </div>
      </div>

              {/* End interview early button */}
        {stage !== STAGE.FINISHED && stage !== STAGE.SETUP && (
          <div className="flex justify-end mb-2">
            <button
              onClick={handleFinishInterview}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: '#f85149', border: '1px solid #30363d' }}
            >
              End Interview
            </button>
          </div>
        )}

      {/* Aria's message card */}
      <div style={card} className="p-5 mb-4">
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{
              backgroundColor: '#0d1117',
              border: `2px solid ${cyan}`,
              color: cyan,
              boxShadow: stage === STAGE.INTRO || stage === STAGE.QUESTION || stage === STAGE.FEEDBACK
                ? `0 0 12px ${cyan}40`
                : 'none'
            }}
          >
            A
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold" style={{ color: cyan }}>Aria</span>
              {(stage === STAGE.INTRO || stage === STAGE.QUESTION || stage === STAGE.FEEDBACK) && (
                <span className="flex gap-0.5">
                  <span className="w-1 h-1 rounded-full animate-bounce" style={{ backgroundColor: cyan, animationDelay: '0ms' }}></span>
                  <span className="w-1 h-1 rounded-full animate-bounce" style={{ backgroundColor: cyan, animationDelay: '150ms' }}></span>
                  <span className="w-1 h-1 rounded-full animate-bounce" style={{ backgroundColor: cyan, animationDelay: '300ms' }}></span>
                </span>
              )}
            </div>
            <p className="text-sm leading-relaxed" style={{ color: textPrimary }}>
              {ariaText || '...'}
            </p>
          </div>
        </div>
      </div>

      {/* Detailed feedback card — shown during feedback stage */}
      {stage === STAGE.FEEDBACK && currentFeedback && (
        <div style={{ ...card, borderColor: '#30363d' }} className="p-4 mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: textMuted }}>
            Detailed feedback
          </p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: 'Structure', score: currentFeedback.star_structure_score },
              { label: 'Specificity', score: currentFeedback.specificity_score },
              { label: 'Fillers', score: currentFeedback.filler_word_count, isCount: true }
            ].map(({ label, score, isCount }) => (
              <div key={label} className="text-center p-2 rounded-lg" style={{ backgroundColor: '#0d1117' }}>
                <p className="text-lg font-bold" style={{
                  color: isCount ? textPrimary :
                    score >= 4 ? '#3fb950' :
                    score >= 3 ? '#d29922' : '#f85149'
                }}>
                  {isCount ? score : `${score}/5`}
                </p>
                <p className="text-xs" style={{ color: textMuted }}>{label}</p>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: '#0d1117', border: `1px solid ${cyan}` }}>
            <p className="text-xs font-semibold mb-1" style={{ color: cyan }}>Suggested rewrite</p>
            <p className="text-xs leading-relaxed" style={{ color: textPrimary }}>
              {currentFeedback.suggested_rewrite}
            </p>
          </div>
        </div>
      )}

      {/* User answer area */}
      {(stage === STAGE.QUESTION || stage === STAGE.LISTENING || stage === STAGE.PROCESSING) && (
        <div style={card} className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm" style={{ color: isListening ? '#f85149' : textMuted }}>
              {stage === STAGE.PROCESSING ? 'Processing your answer...' :
               isListening ? (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#f85149' }}></span>
                  Recording...
                </span>
               ) : 'Your turn to answer'}
            </span>
            {stage === STAGE.QUESTION && (
              <button
                onClick={handleStartAnswer}
                className="px-5 py-2 rounded-lg text-sm font-medium"
                style={{ backgroundColor: cyan, color: '#0d1117' }}
              >
                Start Answer
              </button>
            )}
            {stage === STAGE.LISTENING && (
              <button
                onClick={handleStopAnswer}
                className="px-5 py-2 rounded-lg text-sm font-medium"
                style={{ backgroundColor: '#21262d', border: '1px solid #f85149', color: '#f85149' }}
              >
                Done Answering
              </button>
            )}
          </div>

          <div
            className="min-h-16 p-3 rounded-lg text-sm leading-relaxed"
            style={{
              backgroundColor: '#0d1117',
              border: '1px solid #30363d',
              color: transcript ? textPrimary : textMuted
            }}
          >
            {transcript || 'Your answer will appear here as you speak...'}
          </div>
        </div>
      )}

      {/* Processing state */}
      {stage === STAGE.PROCESSING && (
        <div className="text-center mt-4">
          <p className="text-sm" style={{ color: cyan }}>
            <span className="animate-spin inline-block mr-2">⚙</span>
            Aria is reviewing your answer...
          </p>
        </div>
      )}
    </div>
  );
}