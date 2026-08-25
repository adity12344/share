import { GoogleGenAI } from '@google/genai';

const VALID_CATEGORIES = [
  'Textbooks',
  'Electronics',
  'Services',
  'Opportunities',
  'Dorm Essentials',
] as const;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = body?.prompt;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not configured.');
      return new Response(
        JSON.stringify({
          error: 'GEMINI_API_KEY is not configured on the server.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt.trim(),
      config: {
        systemInstruction: `You are an AI Listing Assistant for Campus Exchange, a college student marketplace. Analyze the user's brief item notes or image description and return a polished, structured JSON object.
Rules:
- Write a catchy, concise title (max 50 characters).
- Write a helpful description highlighting value for a college student.
- Categorize strictly into one of: ['Textbooks', 'Electronics', 'Services', 'Opportunities', 'Dorm Essentials'].
- Estimate a fair market price in INR as a plain number (no currency symbol) based on typical student budgets.
Respond strictly in valid JSON with keys: title (string), description (string), category (string), suggestedPrice (number).`,
        responseMimeType: 'application/json',
      },
    });

    let rawText = response.text || '{}';
    rawText = rawText.trim();
    if (rawText.startsWith('```json')) {
      rawText = rawText.slice(7);
    } else if (rawText.startsWith('```')) {
      rawText = rawText.slice(3);
    }
    if (rawText.endsWith('```')) {
      rawText = rawText.slice(0, -3);
    }
    rawText = rawText.trim();

    const parsed = JSON.parse(rawText);

    const result: {
      title: string;
      description: string;
      category?: string;
      suggestedPrice: number;
    } = {
      title: typeof parsed.title === 'string' ? parsed.title.trim().slice(0, 50) : '',
      description: typeof parsed.description === 'string' ? parsed.description.trim() : '',
      suggestedPrice:
        typeof parsed.suggestedPrice === 'number'
          ? parsed.suggestedPrice
          : typeof parsed.price === 'number'
          ? parsed.price
          : parseFloat(parsed.suggestedPrice || parsed.price) || 0,
    };

    if (
      typeof parsed.category === 'string' &&
      VALID_CATEGORIES.includes(parsed.category.trim() as any)
    ) {
      result.category = parsed.category.trim();
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error generating AI listing:', error);
    return new Response(
      JSON.stringify({
        error: error?.message || 'Failed to generate listing with AI',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
