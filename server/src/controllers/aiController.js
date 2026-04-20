import { asyncHandler } from "../utils/asyncHandler.js";
import { generateSummary } from "../services/aiService.js";

export const getAISummary = asyncHandler(async (req, res) => {
  try {
    const summary = await generateSummary(req.body);
    res.json({ summary });
  } catch (error) {
    const message = error?.message || "AI summary failed";

    if (message.includes("429") || message.toLowerCase().includes("quota")) {
      return res.status(429).json({
        message: "AI insights are temporarily unavailable because the Gemini quota limit was reached. Please try again later."
      });
    }

    return res.status(500).json({
      message: "AI insights are currently unavailable. Please try again later."
    });
  }
});
