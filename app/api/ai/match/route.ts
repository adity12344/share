import { GoogleGenAI } from "@google/genai";

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
    const { wantedItem, availableListings } = body || {};

    if (!wantedItem || typeof wantedItem !== "object") {
      return Response.json({ error: "wantedItem is required" }, { status: 400 });
    }

    if (!Array.isArray(availableListings) || availableListings.length === 0) {
      return Response.json({ matches: [] });
    }

    const candidateListings = availableListings
      .filter((l: any) => l && typeof l.id === "string" && l.status !== "COMPLETED")
      .slice(0, 15)
      .map((l: any) => ({
        id: l.id,
        title: l.title || "",
        description: l.description || "",
        category: l.category || "",
        price: l.price ?? 0,
      }));

    if (candidateListings.length === 0) {
      return Response.json({ matches: [] });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "GEMINI_API_KEY environment variable is not configured." },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const promptPayload = {
      wantedRequest: {
        title: wantedItem.title || "",
        description: wantedItem.description || "",
        category: wantedItem.category || "",
        budget: wantedItem.budget ?? 0,
      },
      candidateListings,
    };

    const modelName = process.env.GEMINI_MODEL || "gemini-3.6-flash";

    const response = await ai.models.generateContent({
      model: modelName,
      contents: JSON.stringify(promptPayload),
      config: {
        systemInstruction: `You are the AI Matching Engine for Share. Compare a student's 'Wanted Request' against an array of available marketplace listings.
Evaluate conceptual relevance (e.g., matching 'Python tutor' request with a 'Data Structures in Python' service listing), budget compatibility, and utility.
For each candidate listing, assign a matchScore (0-100), write a 1-2 sentence explanation of why it fits, and give a recommendation ('connect' | 'maybe' | 'pass').
Respond strictly in valid JSON with key 'matches', an array of objects: [{ listingId: string, matchScore: number, explanation: string, recommendation: string }].`,
        responseMimeType: "application/json",
      },
    });

    const rawText = response.text || "{}";
    const cleaned = cleanJsonString(rawText);
    const parsed = JSON.parse(cleaned);

    const validListingIdSet = new Set(candidateListings.map((l) => l.id));
    const validRecommendations = new Set(["connect", "maybe", "pass"]);

    const rawMatches = Array.isArray(parsed.matches) ? parsed.matches : [];
    const validatedMatches = rawMatches.filter((item: any) => {
      if (!item || typeof item !== "object") return false;
      if (!item.listingId || !validListingIdSet.has(item.listingId)) return false;
      if (
        typeof item.matchScore !== "number" ||
        isNaN(item.matchScore) ||
        item.matchScore < 0 ||
        item.matchScore > 100
      ) {
        return false;
      }
      if (
        typeof item.recommendation !== "string" ||
        !validRecommendations.has(item.recommendation.toLowerCase().trim())
      ) {
        return false;
      }
      return true;
    }).map((item: any) => ({
      listingId: item.listingId,
      matchScore: Math.round(item.matchScore),
      explanation: typeof item.explanation === "string" ? item.explanation.trim() : "",
      recommendation: item.recommendation.toLowerCase().trim() as "connect" | "maybe" | "pass",
    }));

    validatedMatches.sort((a: any, b: any) => b.matchScore - a.matchScore);

    return Response.json({ matches: validatedMatches });
  } catch (error: any) {
    return Response.json(
      { error: error?.message || "Failed to calculate AI matches" },
      { status: 500 }
    );
  }
}
