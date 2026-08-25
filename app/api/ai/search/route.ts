import { GoogleGenAI } from "@google/genai";

const VALID_CATEGORIES = [
  "Textbooks",
  "Electronics",
  "Services",
  "Opportunities",
  "Dorm Essentials",
] as const;

function cleanJsonString(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { query } = body || {};

    if (!query || typeof query !== "string" || !query.trim()) {
      return Response.json({
        searchTerms: [],
        category: null,
        maxBudget: null,
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({
        searchTerms: query.trim().split(/\s+/).filter(Boolean),
        category: null,
        maxBudget: null,
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const modelName = process.env.GEMINI_MODEL || "gemini-3.6-flash";

    const response = await ai.models.generateContent({
      model: modelName,
      contents: query.trim(),
      config: {
        systemInstruction: `You are the search intent engine for Share, a college student marketplace. Analyze natural language search queries from students and extract structured search parameters.
Rules:
- Extract key search terms.
- Detect category if implied from: ['Textbooks', 'Electronics', 'Services', 'Opportunities', 'Dorm Essentials']. Return null if unspecified.
- Detect maximum budget if mentioned (e.g. 'under 800', 'cheap'). Return null if unspecified.
Respond strictly in valid JSON with keys: searchTerms (array of strings), category (string or null), maxBudget (number or null).`,
        responseMimeType: "application/json",
      },
    });

    const rawText = response.text || "{}";
    const cleaned = cleanJsonString(rawText);
    const parsed = JSON.parse(cleaned);

    let category: string | null = null;
    if (
      typeof parsed.category === "string" &&
      VALID_CATEGORIES.includes(parsed.category.trim() as any)
    ) {
      category = parsed.category.trim();
    }

    let maxBudget: number | null = null;
    if (typeof parsed.maxBudget === "number" && !isNaN(parsed.maxBudget) && parsed.maxBudget > 0) {
      maxBudget = Math.round(parsed.maxBudget);
    } else if (typeof parsed.maxBudget === "string") {
      const parsedNum = parseFloat(parsed.maxBudget.replace(/[^0-9.]/g, ""));
      if (!isNaN(parsedNum) && parsedNum > 0) {
        maxBudget = Math.round(parsedNum);
      }
    }

    let searchTerms: string[] = [];
    if (Array.isArray(parsed.searchTerms)) {
      searchTerms = parsed.searchTerms
        .filter((t: any) => typeof t === "string" && t.trim().length > 0)
        .map((t: string) => t.trim());
    }

    if (searchTerms.length === 0 && query.trim()) {
      searchTerms = query.trim().split(/\s+/).filter(Boolean);
    }

    return Response.json({
      searchTerms,
      category,
      maxBudget,
    });
  } catch (error: any) {
    return Response.json(
      {
        searchTerms: [],
        category: null,
        maxBudget: null,
        error: error?.message || "Failed to parse search intent",
      },
      { status: 200 }
    );
  }
}
