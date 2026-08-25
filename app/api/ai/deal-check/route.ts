import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

// In-memory rate limiting store (Map: userId -> { count, resetTime })
const dealCheckRateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const DEFAULT_RATE_LIMIT = 10;

function checkDealCheckRateLimit(identifier: string): boolean {
  const maxLimit = parseInt(
    process.env.DEAL_CHECK_RATE_LIMIT || String(DEFAULT_RATE_LIMIT),
    10
  );
  const now = Date.now();
  const entry = dealCheckRateLimitStore.get(identifier);

  if (!entry || now > entry.resetTime) {
    dealCheckRateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return true;
  }

  if (entry.count >= maxLimit) {
    return false;
  }

  entry.count += 1;
  return true;
}

// Request validation schema
const DealCheckRequestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title cannot be empty')
    .max(200, 'Title cannot exceed 200 characters'),
  category: z
    .string()
    .trim()
    .min(1, 'Category cannot be empty')
    .max(100, 'Category cannot exceed 100 characters'),
  price: z
    .number()
    .refine((val) => Number.isFinite(val), { message: 'Price must be a finite number' })
    .refine((val) => val >= 0, { message: 'Price must be greater than or equal to 0' })
    .refine((val) => val <= 1000000, { message: 'Price exceeds maximum allowed value (1,000,000 INR)' }),
  description: z
    .string()
    .trim()
    .min(1, 'Description cannot be empty')
    .max(2000, 'Description cannot exceed 2000 characters'),
});

// AI Response validation schema
const DealCheckResponseSchema = z.object({
  verdict: z.enum(['Great Deal', 'Fair Price', 'Overpriced']),
  estimatedValue: z.number().nonnegative(),
  explanation: z.string().min(1).max(500),
});

function normalizeModelName(raw?: string | null): string {
  if (!raw) return '';
  let clean = raw.trim().replace(/^["']|["']$/g, '');
  clean = clean.replace(/^models\//i, '');
  return clean;
}

function cleanJsonString(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

export async function POST(req: Request) {
  try {
    // 1. Authentication Check (Firebase Auth token or user identifier)
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    const userIdHeader = req.headers.get('x-user-id');

    let userId: string | null = null;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      if (token.length > 0) {
        userId = token;
      }
    } else if (typeof userIdHeader === 'string' && userIdHeader.trim().length > 0) {
      userId = userIdHeader.trim();
    }

    if (!userId) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized: You must be signed in with your college account to check deal prices.',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 2. In-Memory Rate Limiting Check (~10 requests/min per user)
    const isAllowed = checkDealCheckRateLimit(userId);
    if (!isAllowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded: You can perform up to 10 deal checks per minute. Please wait a moment before trying again.',
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 3. Request Body Parsing and Zod Validation
    let rawBody: any;
    try {
      rawBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON request body.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const validationResult = DealCheckRequestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      const errorMessage = validationResult.error.issues[0]?.message || 'Invalid request format.';
      return new Response(
        JSON.stringify({ error: errorMessage }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { title, category, price, description } = validationResult.data;

    // 4. Verify Gemini API Key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY environment variable is not configured.');
      return new Response(
        JSON.stringify({
          error: 'Deal check is temporarily unavailable.',
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

    const rawConfiguredModel = normalizeModelName(process.env.GEMINI_MODEL);
    const candidateModels = [
      rawConfiguredModel !== 'gemini-3.6-flash' && rawConfiguredModel !== 'gemini-2.5-flash'
        ? rawConfiguredModel
        : '',
      'gemini-3.7-flash',
      'gemini-flash-latest',
      'gemini-3.1-flash-lite',
      'gemini-2.5-flash',
    ].filter((m): m is string => Boolean(m && m.length > 0));

    const uniqueModels = Array.from(new Set(candidateModels));

    const promptPayload = {
      title,
      category,
      price,
      description,
    };

    const systemInstruction = `You are the AI Price Evaluator for Share, a college marketplace.

Your task is to evaluate whether a listed item appears fairly priced for a college student and second-hand marketplace context.

Input:
* Item title
* Category
* Current listed price in INR
* Item description

Classify the price into exactly one verdict:
* Great Deal
* Fair Price
* Overpriced

Estimate a reasonable second-hand/student-market value in INR.

Provide one concise sentence explaining the assessment.

Important limitations:
* This is an estimate, not a guaranteed live market price.
* You do not have access to live marketplace listings unless they are explicitly provided in the input/context.
* Do not claim that you checked live market prices.
* Use item type, apparent condition, age/quality indicators in the description, category, and typical student/second-hand pricing heuristics.
* If the item description is insufficient to make a reasonable estimate, make a conservative estimate and keep the explanation appropriately qualified.

Never invent specific external listings, sellers, websites, or market transactions.

Return only valid JSON matching the required schema.`;

    let response: any = null;
    let lastError: any = null;

    for (const model of uniqueModels) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: JSON.stringify(promptPayload),
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
          },
        });
        if (response) break;
      } catch (err: any) {
        console.warn(`Model ${model} failed in deal check:`, err?.message || err);
        lastError = err;
      }
    }

    if (!response) {
      console.error('All candidate Gemini models failed for deal check:', lastError);
      return new Response(
        JSON.stringify({
          error: 'Deal check is temporarily unavailable.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const rawText = response.text || '{}';
    const cleaned = cleanJsonString(rawText);

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('Failed to parse Gemini JSON output for deal check:', parseErr, rawText);
      return new Response(
        JSON.stringify({
          error: 'Deal check is temporarily unavailable.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Ensure estimatedValue is a clean number if returned as string
    if (typeof parsed.estimatedValue === 'string') {
      parsed.estimatedValue = parseFloat(parsed.estimatedValue.replace(/[^0-9.]/g, '')) || 0;
    }

    // 5. AI Response Validation using Zod
    const aiValidationResult = DealCheckResponseSchema.safeParse(parsed);
    if (!aiValidationResult.success) {
      console.error('Gemini deal check output failed schema validation:', aiValidationResult.error.issues, parsed);
      return new Response(
        JSON.stringify({
          error: 'Deal check is temporarily unavailable.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify(aiValidationResult.data),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Unhandled error in deal-check route:', error);
    return new Response(
      JSON.stringify({
        error: 'Deal check is temporarily unavailable.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
