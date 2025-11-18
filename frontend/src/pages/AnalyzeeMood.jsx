import React, { useState } from 'react';

// This is a simple React component that shows how to call your
// MERN (Express) backend, which in turn calls your Python ML service.

function MoodAnalyzer() {
    const [text, setText] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    // This is the URL of *your* MERN (Express) backend
    const MERN_API_URL = 'http://localhost:8080/api/analyze-mood';

    const handleSubmit = async () => {
        setLoading(true);
        setResult(null);

        try {
            const response = await fetch(MERN_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: text }),
            });

            if (!response.ok) {
                throw new Error('Failed to get a response from the server.');
            }

            const data = await response.json();
            setResult(data);

        } catch (error) {
            setResult({ error: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial' }}>
            <h2>MindEase AI Mood Analyzer</h2>
            <textarea
                rows="5"
                cols="50"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="How are you feeling today?"
                style={{ display: 'block', marginBottom: '10px' }}
            />
            <button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Analyzing...' : 'Analyze My Mood'}
            </button>

            {result && (
                <div style={{ marginTop: '20px' }}>
                    <h3>Analysis Result:</h3>
                    {result.error ? (
                        <pre style={{ color: 'red' }}>{result.error}</pre>
                    ) : (
                        <pre style={{ backgroundColor: '#f4f4f4', padding: '10px' }}>
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    )}
                </div>
            )}
        </div>
    );
}

export default MoodAnalyzer;