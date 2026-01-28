
import { GoogleGenAI } from "@google/genai";
import { EntryCategory } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const DEFAULT_SLIP_PROMPT = `بصفتك خبير لغوي ساخر وفكاهي، قم بتحليل "الكلجة" (الخطأ النطقي) التالية.
المطلوب:
1. تخمين الكلمة التي كان يقصدها.
2. تفسير فكاهي قصير لماذا حدث هذا الخطأ.
3. نصيحة ساخرة لتجنب تكرارها.
اجعل الرد باللهجة العربية العامية وبشكل مختصر جداً.`;

const DEFAULT_JOKE_PROMPT = `بصفتك "ملك السماجة" المقيم، قم بتحليل "الذبة البايخة" (النكتة السماجة) التالية.
المطلوب:
1. تقييم مستوى "السماجة" من 10.
2. رد فعل ساخر ومحطم للجبهة تجاه برودة هذه الذبة.
3. اطلب منه عدم تكرار هذا الجرم بحق الفكاهة.
اجعل الرد باللهجة العربية العامية وبشكل مضحك وساخر جداً.`;

export const analyzeEntry = async (
  name: string, 
  content: string, 
  category: EntryCategory,
  customPrompt?: string
): Promise<string> => {
  try {
    const isSlip = category === 'slip';
    const basePrompt = customPrompt || (isSlip ? DEFAULT_SLIP_PROMPT : DEFAULT_JOKE_PROMPT);
    
    const prompt = `الشخص: ${name}
المحتوى: "${content}"
التعليمات: ${basePrompt}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "الذكاء الاصطناعي أعلن استسلامه أمام هذه التحفة!";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "يبدو أن هذا المستوى من الإبداع كسر خوارزمياتنا!";
  }
};
