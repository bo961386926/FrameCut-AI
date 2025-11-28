import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing in environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeFrame = async (base64Image: string, prompt: string = "Describe this video frame in detail suitable for a caption."): Promise<string> => {
  const client = getClient();
  if (!client) return "Error: API Key missing.";

  try {
    // Strip the data:image/png;base64, prefix if present for the API call
    const cleanBase64 = base64Image.split(',')[1];

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: cleanBase64
            }
          },
          {
            text: prompt
          }
        ]
      }
    });

    return response.text || "No description generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to analyze image. Please check console for details.";
  }
};
