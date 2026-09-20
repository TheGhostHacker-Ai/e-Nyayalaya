// components/DownloadRecordButton.jsx
//
// Calls the server-side PDF endpoint and triggers a real file download.
// No window.print(), no dialog, no risk of dashboard chrome leaking in.

import { useState } from 'react';

export default function DownloadRecordButton({ caseId, caseNumber }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleDownload() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/record.pdf`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (!res.ok) throw new Error('Failed to generate record');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${caseNumber}-record.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError('Could not download the record. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={handleDownload} disabled={loading}>
        {loading ? 'Generating…' : 'Download Case Record (PDF)'}
      </button>
      {error && <p style={{ color: '#b00020', fontSize: 13 }}>{error}</p>}
    </div>
  );
}

function getAuthToken() {
  // however you currently read the Supabase session token
  return window.__supabaseSession?.access_token ?? '';
}
