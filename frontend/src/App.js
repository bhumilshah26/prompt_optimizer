import React, { useState } from 'react';
import './App.css';

// Star rating component
const StarRating = ({ rating, setRating, disabled }) => {
  return (
    <div className="star-rating">
      {[...Array(5)].map((star, index) => {
        const ratingValue = index + 1;
        return (
          <button
            type="button"
            key={ratingValue}
            className={ratingValue <= rating ? "on" : "off"}
            onClick={() => !disabled && setRating(ratingValue)}
            disabled={disabled}
          >
            <span className="star">&#9733;</span>
          </button>
        );
      })}
    </div>
  );
};


function App() {
  const BACKEND_URL = process.env.BACKEND_URL
  const [goal, setGoal] = useState("");
  const [textData, setTextData] = useState("");
  
  const [prompts, setPrompts] = useState([]);
  const [results, setResults] = useState({}); // Store responses, ratings, etc. by index
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle initial prompt generation
  const handleGeneratePrompts = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setPrompts([]);
    setResults({});

    try {
      const response = await fetch(BACKEND_URL + '/generate_prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, text_data: textData }),
      });
      if (!response.ok) throw new Error('Failed to generate prompts.');
      
      const data = await response.json();
      setPrompts(data.prompts);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Get a response for a specific prompt
  const handleGetResponse = async (promptText, index) => {
    setResults(prev => ({ ...prev, [index]: { ...prev[index], isLoading: true } }));

    try {
      const response = await fetch(BACKEND_URL + '/get_llm_response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText }),
      });
      if (!response.ok) throw new Error('Failed to get LLM response.');

      const data = await response.json();
      setResults(prev => ({ 
        ...prev, 
        [index]: { ...prev[index], response: data.response, isLoading: false } 
      }));
    } catch (error) {
      setResults(prev => ({ ...prev, [index]: { ...prev[index], error: error.message, isLoading: false } }));
    }
  };
  
  // Handle rating change
  const handleRating = (index, rating) => {
    setResults(prev => ({ ...prev, [index]: { ...prev[index], rating } }));
  };

  // Submit feedback for a specific prompt-response pair
  const handleSubmitFeedback = async (index) => {
    const result = results[index];
    const prompt = prompts[index];

    setResults(prev => ({ ...prev, [index]: { ...prev[index], isSubmitting: true } }));

    try {
      await fetch('http://127.0.0.1:8000/submit_feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.prompt,
          response: result.response,
          rating: result.rating,
          goal: goal,
        }),
      });
      
      setResults(prev => ({ 
        ...prev, 
        [index]: { ...prev[index], feedbackSubmitted: true, isSubmitting: false } 
      }));

    } catch (error) {
       setResults(prev => ({ ...prev, [index]: { ...prev[index], error: 'Failed to submit feedback.', isSubmitting: false } }));
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Adaptive Prompt Optimizer</h1>
        <p>Generate & Rate Multiple Prompt Strategies</p>
      </header>
      <main className="App-main">
        <form onSubmit={handleGeneratePrompts} className="prompt-form">
          <div className="form-group">
            <label htmlFor="goal">Your Goal</label>
            <textarea id="goal" value={goal} placeholder='Enter your goal' onChange={(e) => setGoal(e.target.value)} rows="3" />
          </div>
          <div className="form-group">
            <label htmlFor="text_data">Your Text Data</label>
            <textarea id="text_data" value={textData} placeholder='Enter text' onChange={(e) => setTextData(e.target.value)} rows="6" />
          </div>
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Generating Strategies...' : 'Generate Prompt Strategies'}
          </button>
        </form>

        {error && <div className="error-message">{error}</div>}
        
        <div className="prompts-container">
          {prompts.map((prompt, index) => {
            const result = results[index] || {};
            return (
              <div key={index} className="prompt-card">
                <h3>Strategy: {prompt.strategy}</h3>
                <pre className="prompt-display">{prompt.prompt}</pre>
                
                { !result.response && (
                  <button onClick={() => handleGetResponse(prompt.prompt, index)} disabled={result.isLoading}>
                    {result.isLoading ? 'Getting Response...' : 'Get Response'}
                  </button>
                )}

                {result.response && (
                  <div className="response-section">
                    <h4>Model Response:</h4>
                    <pre className="response-display">{result.response}</pre>
                    
                    <h4>Rate this Prompt & Response</h4>
                    <div className="feedback-section">
                       <StarRating 
                          rating={result.rating || 0} 
                          setRating={(rating) => handleRating(index, rating)}
                          disabled={result.feedbackSubmitted}
                       />
                       <button
                          onClick={() => handleSubmitFeedback(index)}
                          disabled={!result.rating || result.isSubmitting || result.feedbackSubmitted}
                       >
                         {result.feedbackSubmitted ? 'Feedback Submitted!' : (result.isSubmitting ? 'Submitting...' : 'Submit Feedback')}
                       </button>
                    </div>
                  </div>
                )}
                {result.error && <div className="error-message small">{result.error}</div>}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default App;