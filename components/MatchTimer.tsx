
import React, { useEffect, useState } from 'react';

interface MatchTimerProps {
    startTime?: string;
    timeLimit?: number;
    className?: string;
}

const MatchTimer: React.FC<MatchTimerProps> = ({ startTime, timeLimit, className = "font-mono font-bold text-white" }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) return;
    
    const updateTimer = () => {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      setElapsed(Math.floor((now - start) / 1000));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.floor(Math.abs(seconds) % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const timeLeft = timeLimit ? timeLimit - elapsed : elapsed;

  return (
    <span className={className}>
      {timeLimit ? (
          <>{timeLeft < 0 ? '+' : ''}{formatTime(timeLeft)}</>
      ) : (
          formatTime(elapsed)
      )}
    </span>
  );
};

export default MatchTimer;
