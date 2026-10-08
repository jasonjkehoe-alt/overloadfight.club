import express from 'express';
import db from '../db.js';
import { requireAuth } from '../auth.js';
import { GoogleGenAI } from "@google/genai";

// The admin-only AI match analysis.
const router = express.Router();

// POST /api/analyze-match - Generate AI Analysis for a game
router.post('/analyze-match', requireAuth, async (req, res) => {
    let ai;
    try {
        const gameData = req.body;
        if (!gameData) {
            return res.status(400).json({ error: "No game data provided" });
        }

        // 1. Get API Key (Env Var > DB Setting)
        let apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            const keySetting = db.getAdminSetting.get('GEMINI_API_KEY');
            if (keySetting && keySetting.value) {
                apiKey = keySetting.value;
            }
        }

        if (!apiKey) {
            return res.status(500).json({ error: "AI Service not configured (Key missing). Set GEMINI_API_KEY in environment or Admin Panel." });
        }

        // 2. Initialize Gemini
        ai = new GoogleGenAI({ apiKey });

        // 3. Construct Prompt
        const playersList = gameData.players?.map(p => `- ${p.name} (K:${p.kills}/D:${p.deaths}/A:${p.assists})`).join('\n') || "Unknown players";
        const damageList = gameData.damage?.slice(0, 5).map(d => `${d.attacker} hit ${d.defender} with ${d.weapon} for ${Math.round(d.damage)}`).join('\n') || "No damage data";
        const killFeed = gameData.kills?.slice(0, 5).map(k => `${k.attacker} killed ${k.defender} with ${k.weapon}`).join('\n') || "No kills";

        const prompt = `
          Analyze the following Overload (6DOF shooter) match statistics and provide a specialized, exciting commentary summary.
          Highlight the MVP, the most effective weapon, and any interesting rivalries based on the kill feed.
          
          Match Info: ${gameData.settings?.matchMode || 'Unknown Mode'} on ${gameData.settings?.level || 'Unknown Level'}
          Date: ${gameData.date || 'Unknown Date'}
          
          Players:
          ${playersList}
          
          Notable Weapon Usage (from first 5 records):
          ${damageList}
    
          Kill Feed Sample:
          ${killFeed}
          
          Keep it under 150 words. Use a sportscaster tone.
        `;

        // 4. Call API
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
        });

        // Handle response text extraction safely
        let text = "Analysis generated but text extraction failed.";
        if (response && typeof response.text === 'function') {
            text = response.text();
        } else if (response && response.text) {
            text = response.text;
        } else if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
            text = response.candidates[0].content.parts[0].text;
        }

        res.json({ text });

    } catch (e) {
        console.error("AI Analysis Failed:", e);
        const msg = e.response?.data?.error?.message || e.message || "Unknown Error";
        res.status(500).json({ error: "AI Analysis Failed: " + msg });
    }
});

export default router;
