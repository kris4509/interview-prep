import React, { useState, useEffect } from 'react';
import api from '../api/client';

export default function SessionHistory() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    setLoading(true);
    const { data } = await api.get('/sessions');
    setSessions(data);
    setLoading(false);
  }

  async function viewSession(id) {
    const { data } = await api.get(`/sessions/${id}`);
    setSelectedSession(data);
  }

  if (selectedSession) {
    return (
      <SessionDetail
        session={selectedSession}
        onBack={() => setSelectedSession(null)}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 mt-10">
      <h1 className="text-xl font-semibold text-gray-900 mb-4">Your Practice Sessions</h1>

      {loading && <p className="text-gray-500 text-sm">Loading...</p>}

      {!loading && sessions.length === 0 && (
        <p className="text-gray-500 text-sm">No sessions yet. Go practice!</p>
      )}

      <div className="space-y-3">
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => viewSession(session.id)}
            className="w-full text-left bg-white shadow rounded-lg p-4 hover:bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">{session.title}</span>
              <span className="text-xs text-gray-400">
                {new Date(session.started_at).toLocaleDateString()}
              </span>
            </div>
            <span className="text-xs text-gray-500">
              {session.mode === 'online' ? 'Online' : 'In-person'}
              {session.ended_at ? ' · Completed' : ' · In progress'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SessionDetail({ session, onBack }) {
  return (
    <div className="max-w-2xl mx-auto p-6 mt-10">
      <button onClick={onBack} className="text-sm text-indigo-600 hover:underline mb-4">
        ← Back to sessions
      </button>

      <h1 className="text-xl font-semibold text-gray-900 mb-1">{session.session.title}</h1>
      <p className="text-xs text-gray-500 mb-6">
        {new Date(session.session.started_at).toLocaleString()}
      </p>

      {session.responses.length === 0 && (
        <p className="text-sm text-gray-500">No answers recorded in this session.</p>
      )}

      <div className="space-y-4">
        {session.responses.map((response) => (
          <div key={response.id} className="bg-white shadow rounded-lg p-5">
            <span className="inline-block text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded mb-2">
              {response.category?.replace('_', ' ')}
            </span>
            <p className="font-medium text-gray-900 mb-2">{response.question_text}</p>
            <p className="text-sm text-gray-600 mb-3 italic">"{response.transcript_text}"</p>

            {response.star_structure_score != null && (
              <div className="flex gap-4 text-sm border-t pt-3">
                <span className="text-gray-700">
                  Structure: <span className="font-semibold">{response.star_structure_score}/5</span>
                </span>
                <span className="text-gray-700">
                  Specificity: <span className="font-semibold">{response.specificity_score}/5</span>
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}