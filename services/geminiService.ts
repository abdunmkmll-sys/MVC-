
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeKalja = async (name: string, content: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `بصفتك خبير لغوي كوميدي، حلل هذه "الكلجة" (خطأ نطقي) التي قالها ${name}: "${content}". 
      أعطني تحليل قصير جداً وفكاهي (سطر واحد) يفسر سبب حدوث الخطأ بأسلوب ساخر.`,
    });
    return response.text || "تحليل معقد لدرجة أن الذكاء الاصطناعي نفسه انصدم!";
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return "يبدو أن الذكاء الاصطناعي أخذ استراحة من الضحك.";
  }
};
