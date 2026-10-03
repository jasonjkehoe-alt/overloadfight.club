import React, { useState } from 'react';
import { GameData } from '../types';
import { analyzeGameMatch } from '../services/geminiService';

interface AnalysisProps {
  game: GameData;
}

const Analysis: React.FC<AnalysisProps> = ({ game }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    const result = await analyzeGameMatch(game);
    setAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="bg-[#111] border border-gray-800 p-6 rounded mt-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
            AI Match Analysis
            <span className="text-xs font-normal text-[#ff6600] border border-[#ff6600] px-1 rounded">BETA</span>
        </h3>
        {!analysis && !loading && (
            <button 
                onClick={handleAnalyze}
                className="bg-[#ff6600] hover:bg-[#e65c00] text-white px-4 py-2 rounded text-sm font-bold transition-colors flex items-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Commentary
            </button>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="w-8 h-8 border-4 border-[#ff6600] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 animate-pulse">Processing match telemetry...</p>
        </div>
      )}

      {analysis && (
        <div className="prose prose-invert max-w-none">
            <div className="p-4 bg-[#1a1a1a] border-l-4 border-[#ff6600] rounded-r">
                <p className="text-gray-200 whitespace-pre-line leading-relaxed font-mono text-sm">
                    {analysis}
                </p>
            </div>
            <div className="mt-4 flex justify-end">
                 <button 
                    onClick={() => setAnalysis(null)}
                    className="text-gray-500 hover:text-gray-300 text-xs underline"
                >
                    Clear Analysis
                </button>
            </div>
        </div>
      )}
      
      {!analysis && !loading && (
          <p className="text-gray-500 text-sm">
              Click the button above to use Google Gemini AI to analyze the kill feed, damage matrix, and player performance to generate a post-match summary.
          </p>
      )}
    </div>
  );
};

export default Analysis;