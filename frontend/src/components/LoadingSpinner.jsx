import { useEffect, useState } from 'react';

/**
 * LoadingSpinner Component
 * Displays a graceful loading state with progressive messaging for slow API responses.
 * 
 * Features:
 * - Shows immediate loading message (0-3 seconds)
 * - Shows "waking up" message for slow responses (3-8 seconds)
 * - Shows "still loading" message for very slow responses (8+ seconds)
 * - Useful for handling Render's cold start and other slow backends
 * 
 * @param {string} message - Initial loading message (default: "Loading...")
 * @param {number} slowThreshold - Time in ms before showing "waking up" message (default: 3000)
 * @param {number} verySlowThreshold - Time in ms before showing "still loading" message (default: 8000)
 */
export default function LoadingSpinner({ 
  message = 'Loading...', 
  slowThreshold = 3000, 
  verySlowThreshold = 8000 
}) {
  const [displayMessage, setDisplayMessage] = useState(message);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => {
        const newElapsed = prev + 100;
        
        // Update message based on elapsed time
        if (newElapsed >= verySlowThreshold) {
          setDisplayMessage(
            `${message} (This is taking longer than expected. The backend might be waking up...)`
          );
        } else if (newElapsed >= slowThreshold) {
          setDisplayMessage(
            `${message} (Waking up the backend, please be patient...)`
          );
        }
        
        return newElapsed;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [message, slowThreshold, verySlowThreshold]);

  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p className="loading-text">{displayMessage}</p>
      <p className="loading-hint">
        {elapsed >= verySlowThreshold && (
          "Render's free tier spins down inactive services. This is normal on first load."
        )}
        {elapsed >= slowThreshold && elapsed < verySlowThreshold && (
          "Free backend services may take a moment to start up."
        )}
      </p>
    </div>
  );
}
