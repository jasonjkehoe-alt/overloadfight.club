import axios from 'axios';
import { GameData } from "../types";

export const analyzeGameMatch = async (gameData: GameData): Promise<string> => {
  try {
    const response = await axios.post('/api/analyze-match', gameData);
    return response.data.text || "Analysis failed to generate text.";
  } catch (error: any) {
    console.error("Gemini analysis error:", error);
    if (error.response && error.response.data && error.response.data.error) {
      return `Error: ${error.response.data.error}`;
    }
    return "Error connecting to AI analysis service.";
  }
};
