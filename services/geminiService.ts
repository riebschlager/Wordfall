import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateCreativeText = async (topic: string): Promise<string> => {
  try {
    const modelId = 'gemini-2.5-flash';
    const prompt = `Generate a short, creative, and whimsical sentence or haiku about "${topic}". 
    Keep it under 100 characters. Return ONLY the raw text, no markdown, no quotes.`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });

    return response.text || "Creativity is loading...";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error fetching inspiration. Try typing yourself!";
  }
};

export const generateFallingPoem = async (): Promise<string> => {
  try {
    const modelId = 'gemini-2.5-flash';
    const prompt = `Write a prose poem about the philosophical significance of "falling". 
    Touch upon autumn leaves, falling in love, falling asleep, and letting go. 
    The tone should be contemplative and soothing. 
    Return raw text only, no titles, no markdown. Keep it under 500 characters.`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });

    return response.text || "Falling is the art of letting gravity hold you...";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "To fall is to trust the air, to let the ground catch you, to release the grip of control and find peace in the descent...";
  }
};