import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-3.5-flash';
const GEMINI_FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.5-flash';

async function callGemini(prompt: string) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  console.log(`[AI] Starting request to ${GEMINI_MODEL}. Prompt length: ${prompt.length} chars.`);
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.1,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    });

    // The @google/genai v2 SDK provides a .text property on the response
    const resultText = response.text || '';
    
    console.log(`[AI] ${GEMINI_MODEL} request completed. Response length: ${resultText.length} chars.`);
    
    if (resultText.length < 100 && prompt.length > 500) {
       console.warn(`[AI] Warning: Response seems unusually short (${resultText.length} chars) compared to prompt (${prompt.length} chars).`);
    }

    return resultText;
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.warn(`Primary model ${GEMINI_MODEL} failed:`, err);
    
    // Check if it's a model not found error or overloaded
    const isModelError = err.message && (err.message.includes('not found') || err.message.includes('404'));
    const isBusyError = err.message && (err.message.includes('busy') || err.message.includes('503') || err.message.includes('overloaded'));

    if ((isBusyError || isModelError) && GEMINI_FALLBACK_MODEL) {
      console.log(`[AI] Attempting to use fallback model: ${GEMINI_FALLBACK_MODEL}`);
      try {
        const fallbackAi = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        const fallbackResponse = await fallbackAi.models.generateContent({
          model: GEMINI_FALLBACK_MODEL,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            temperature: 0.1,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          },
        });
        
        const fallbackResult = fallbackResponse.text || '';
        console.log(`[AI] Fallback model ${GEMINI_FALLBACK_MODEL} completed. Response length: ${fallbackResult.length} chars.`);
        return fallbackResult;
      } catch (fallbackError) {
        console.error(`[AI] Fallback model ${GEMINI_FALLBACK_MODEL} also failed:`, fallbackError);
        throw fallbackError;
      }
    }
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const { action, text, context } = await req.json();

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ 
        result: `[KEY REQUIRED] Please configure GEMINI_API_KEY in your .env file to use AI features.` 
      });
    }

    if (action === 'translate') {
      const prompt = `
        Translate the following Talmudic text (Aramaic/Hebrew) into clear, modern English.
        
        CRITICAL RULES:
        1. PROVIDE A COMPLETE AND EXHAUSTIVE TRANSLATION. Do not omit any part of the text.
        2. DO NOT transliterate technical Talmudic terms (e.g., do not write "Mishna", "Gemara", "Shema", "Tanna", "Amora").
        3. INSTEAD, use the original Hebrew/Aramaic script for these terms within the English sentence (e.g., write "the משנה says", "the גמרא asks").
        4. Maintain the logical flow and explain any difficult metaphors if necessary for clarity.
        5. If the text is long, continue until the entire segment is translated.
        
        Text to translate:
        "${text}"
        
        Context: ${context || 'Talmudic commentary'}
      `;

      const result = await callGemini(prompt);
      return NextResponse.json({ result });
    }

    if (action === 'explain') {
      const prompt = `
        Provide a comprehensive and deep explanation of the following Talmudic section.
        
        CRITICAL RULES:
        1. BE THOROUGH. Explain the background, the logic, and the conclusion.
        2. DO NOT transliterate technical Talmudic terms.
        3. USE the original Hebrew/Aramaic script for these terms within the English explanation.
        4. Break down the logical argument and the significance of the discussion.
        
        Section text:
        "${text}"
        
        Context: ${context || 'Talmudic tractate'}
      `;

      const result = await callGemini(prompt);
      return NextResponse.json({ result });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    console.error('AI Action Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
