import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { CAMPUS_KNOWLEDGE } from "./lib/ai/campusKnowledge";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";

dotenv.config({ path: ".env.local" });
dotenv.config();

const DEPRECATED_MODELS = new Set([
  "gemini-2.5-flash",
  "gemini-3.6-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-pro",
  "gemini-2.0-flash",
  "gemini-2.0-pro",
  "gemini-2.0-flash-thinking",
]);

function normalizeModelName(raw?: string | null): string {
  if (!raw) return "";
  let clean = raw.trim().replace(/^["']|["']$/g, "");
  // In case the environment variable value was accidentally pasted with 'KEY=value' format
  if (clean.includes("=")) {
    clean = clean.split("=").pop()?.trim() || "";
    clean = clean.replace(/^["']|["']$/g, "");
  }
  clean = clean.replace(/^models\//i, "").trim().toLowerCase();

  if (DEPRECATED_MODELS.has(clean)) {
    return "";
  }

  // Must match valid model name format (e.g. gemini-3.7-flash)
  if (!/^[a-z0-9][-a-z0-9.]*$/.test(clean)) {
    return "";
  }

  return clean;
}

function getCandidateModels(): string[] {
  const configuredModel = normalizeModelName(process.env.GEMINI_MODEL);
  const models = [
    configuredModel,
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite",
    "gemini-3.7-flash",
  ].filter((m): m is string => Boolean(m && m.length > 0));
  return Array.from(new Set(models));
}

let cachedGenAI: GoogleGenAI | null = null;
let lastApiKey: string | null = null;

function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!cachedGenAI || lastApiKey !== apiKey) {
    cachedGenAI = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    lastApiKey = apiKey;
  }
  return cachedGenAI;
}

// Ultra-fast in-memory cache for repeated queries / calculations
const responseCache = new Map<string, { data: any; expiresAt: number }>();

function getFromCache<T>(key: string): T | null {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    responseCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setInCache(key: string, data: any, ttlMs: number = 10 * 60 * 1000): void {
  // Cap cache size to 500 entries
  if (responseCache.size > 500) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey) responseCache.delete(oldestKey);
  }
  responseCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

function isTransientError(err: any): boolean {
  if (!err) return false;
  const status = err?.status || err?.code || err?.statusCode;
  const message = String(err?.message || "").toLowerCase();
  return (
    status === 503 ||
    status === 429 ||
    status === "UNAVAILABLE" ||
    status === "RESOURCE_EXHAUSTED" ||
    message.includes("high demand") ||
    message.includes("unavailable") ||
    message.includes("overloaded") ||
    message.includes("rate limit")
  );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateWithFallback(
  ai: GoogleGenAI,
  contents: any,
  config: any,
  timeoutMs: number = 6000
) {
  let lastError: any = null;
  const candidateModels = getCandidateModels();

  for (const model of candidateModels) {
    const maxAttempts = 2;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const generatePromise = ai.models.generateContent({
          model,
          contents,
          config,
        });

        // Add a timeout promise to fail fast if model hangs
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Model ${model} request timed out after ${timeoutMs}ms`)), timeoutMs)
        );

        const response = (await Promise.race([generatePromise, timeoutPromise])) as any;
        return response;
      } catch (err: any) {
        lastError = err;
        const transient = isTransientError(err);

        if (transient && attempt < maxAttempts) {
          // Wait briefly before retrying
          await sleep(250 * attempt);
          continue;
        }

        // Advance quickly to next candidate model
        break;
      }
    }
  }
  throw lastError || new Error("All candidate Gemini models failed.");
}

// Server-side Firestore initialization and snapshot fetching
let serverFirebaseApp: any = null;
let serverDb: any = null;

function getServerFirestore() {
  if (serverDb) return serverDb;
  const apiKey = process.env.VITE_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  
  if (apiKey && projectId) {
    try {
      const firebaseConfig = {
        apiKey,
        authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
        projectId,
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
        messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.VITE_FIREBASE_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      };
      
      serverFirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      serverDb = getFirestore(serverFirebaseApp);
      return serverDb;
    } catch (e) {
      console.warn("Server-side Firebase initialization failed: ", e);
    }
  }
  return null;
}

interface SanitizedProductSnapshot {
  title: string;
  category: string;
  priceOrBudget: number;
  status: string;
}

async function fetchLiveProductsSnapshot(clientListings?: any[], clientWanted?: any[]): Promise<{
  listings: SanitizedProductSnapshot[];
  wanted: SanitizedProductSnapshot[];
}> {
  const listings: SanitizedProductSnapshot[] = [];
  const wanted: SanitizedProductSnapshot[] = [];
  
  const db = getServerFirestore();
  if (db) {
    try {
      // Fetch 20 most recent OPEN listings
      const listingsRef = collection(db, "listings");
      const listingsQuery = query(
        listingsRef,
        where("status", "==", "OPEN"),
        orderBy("createdAt", "desc"),
        limit(20)
      );
      const listingsSnap = await getDocs(listingsQuery);
      listingsSnap.forEach((doc) => {
        const data = doc.data();
        listings.push({
          title: data.title || "",
          category: data.category || "",
          priceOrBudget: Number(data.price) || 0,
          status: "OPEN",
        });
      });
    } catch (e) {
      console.warn("Failed server-side Firestore listings query: ", e);
    }
    
    try {
      // Fetch 20 most recent OPEN wanted items
      const wantedRef = collection(db, "wanted");
      const wantedQuery = query(
        wantedRef,
        where("status", "==", "OPEN"),
        orderBy("createdAt", "desc"),
        limit(20)
      );
      const wantedSnap = await getDocs(wantedQuery);
      wantedSnap.forEach((doc) => {
        const data = doc.data();
        wanted.push({
          title: data.title || "",
          category: data.category || "",
          priceOrBudget: Number(data.budget) || 0,
          status: "OPEN",
        });
      });
    } catch (e) {
      console.warn("Failed server-side Firestore wanted query: ", e);
    }
  }
  
  // Graceful fallback to client-supplied data if server query yielded nothing
  if (listings.length === 0 && Array.isArray(clientListings)) {
    const active = clientListings.filter((l) => l && l.status === "OPEN");
    const sorted = active
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 20);
    sorted.forEach((l) => {
      listings.push({
        title: l.title || "",
        category: l.category || "",
        priceOrBudget: Number(l.price) || 0,
        status: "OPEN",
      });
    });
  }
  
  if (wanted.length === 0 && Array.isArray(clientWanted)) {
    const active = clientWanted.filter((w) => w && w.status === "OPEN");
    const sorted = active
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 20);
    sorted.forEach((w) => {
      wanted.push({
        title: w.title || "",
        category: w.category || "",
        priceOrBudget: Number(w.budget) || 0,
        status: "OPEN",
      });
    });
  }
  
  // If still empty (e.g., initial local dev mode with no databases filled yet), fetch from mockData
  if (listings.length === 0) {
    try {
      const { INITIAL_MOCK_LISTINGS } = await import("./src/data/mockData");
      if (Array.isArray(INITIAL_MOCK_LISTINGS)) {
        INITIAL_MOCK_LISTINGS.filter(l => l.status === "OPEN").slice(0, 20).forEach(l => {
          listings.push({
            title: l.title || "",
            category: l.category || "",
            priceOrBudget: Number(l.price) || 0,
            status: "OPEN",
          });
        });
      }
    } catch (e) {}
  }

  if (wanted.length === 0) {
    try {
      const { INITIAL_MOCK_WANTED } = await import("./src/data/mockData");
      if (Array.isArray(INITIAL_MOCK_WANTED)) {
        INITIAL_MOCK_WANTED.filter(w => w.status === "OPEN").slice(0, 20).forEach(w => {
          wanted.push({
            title: w.title || "",
            category: w.category || "",
            priceOrBudget: Number(w.budget) || 0,
            status: "OPEN",
          });
        });
      }
    } catch (e) {}
  }
  
  return { listings, wanted };
}

// In-memory rate limiting store for Campus Bot (Map: userId/ip -> { count, resetTime })
const assistantRateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const DEFAULT_RATE_LIMIT = 10;

function checkAssistantRateLimit(identifier: string): boolean {
  const maxLimit = parseInt(
    process.env.CAMPUS_ASSISTANT_RATE_LIMIT || String(DEFAULT_RATE_LIMIT),
    10
  );
  const now = Date.now();
  const entry = assistantRateLimitStore.get(identifier);

  if (!entry || now > entry.resetTime) {
    assistantRateLimitStore.set(identifier, {
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

// In-memory rate limiting store for AI Deal Checker
const dealCheckRateLimitStore = new Map<string, { count: number; resetTime: number }>();

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

// Zod schemas for Campus Assistant
const AssistantMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z
    .string()
    .trim()
    .min(1, "Message content cannot be empty")
    .max(2000, "Message length exceeds maximum allowed limit (2000 characters)"),
});

const AssistantRequestSchema = z.object({
  messages: z
    .array(AssistantMessageSchema)
    .min(1, "At least one message is required")
    .max(50, "Total conversation history exceeds maximum allowed limit"),
  listings: z
    .array(z.any())
    .optional(),
  wanted: z
    .array(z.any())
    .optional(),
});

// Zod schemas for AI Deal Checker
const DealCheckRequestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title cannot be empty")
    .max(200, "Title cannot exceed 200 characters"),
  category: z
    .string()
    .trim()
    .min(1, "Category cannot be empty")
    .max(100, "Category cannot exceed 100 characters"),
  price: z
    .number()
    .refine((val) => Number.isFinite(val), { message: "Price must be a finite number" })
    .refine((val) => val >= 0, { message: "Price must be greater than or equal to 0" })
    .refine((val) => val <= 1000000, { message: "Price exceeds maximum allowed value (1,000,000 INR)" }),
  description: z
    .string()
    .trim()
    .min(1, "Description cannot be empty")
    .max(2000, "Description cannot exceed 2000 characters"),
});

const DealCheckResponseSchema = z.object({
  verdict: z.enum(["Great Deal", "Fair Price", "Overpriced"]),
  estimatedValue: z.number().nonnegative(),
  explanation: z.string().min(1).max(500),
});

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

function fallbackHeuristicListing(prompt: string) {
  const p = prompt.toLowerCase();
  let category: string = "Textbooks";
  let suggestedPrice = 450;

  if (
    p.includes("laptop") ||
    p.includes("phone") ||
    p.includes("macbook") ||
    p.includes("arduino") ||
    p.includes("monitor") ||
    p.includes("mouse") ||
    p.includes("charger") ||
    p.includes("earbuds") ||
    p.includes("electronics") ||
    p.includes("cable") ||
    p.includes("usb") ||
    p.includes("ipad") ||
    p.includes("headphone")
  ) {
    category = "Electronics";
    suggestedPrice = 1200;
  } else if (
    p.includes("tutor") ||
    p.includes("tuition") ||
    p.includes("service") ||
    p.includes("notes") ||
    p.includes("resume") ||
    p.includes("design") ||
    p.includes("freelance") ||
    p.includes("coding")
  ) {
    category = "Services";
    suggestedPrice = 350;
  } else if (
    p.includes("hackathon") ||
    p.includes("team") ||
    p.includes("project") ||
    p.includes("lead") ||
    p.includes("internship") ||
    p.includes("competition")
  ) {
    category = "Opportunities";
    suggestedPrice = 0;
  } else if (
    p.includes("mattress") ||
    p.includes("kettle") ||
    p.includes("chair") ||
    p.includes("lamp") ||
    p.includes("cooler") ||
    p.includes("curtain") ||
    p.includes("pillow") ||
    p.includes("bucket") ||
    p.includes("dorm") ||
    p.includes("hostel")
  ) {
    category = "Dorm Essentials";
    suggestedPrice = 500;
  }

  const priceMatch = prompt.match(/(?:₹|rs\.?|inr|\$)?\s*(\d{2,6})/i);
  if (priceMatch && priceMatch[1]) {
    const parsed = parseInt(priceMatch[1], 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 100000) {
      suggestedPrice = parsed;
    }
  }

  const cleanPrompt = prompt.trim();
  const title = cleanPrompt.length > 50 ? cleanPrompt.slice(0, 47) + "..." : cleanPrompt;
  const description = `${cleanPrompt}. Available for direct campus pickup at SRMIST hostel / Tech Park.`;

  return {
    title,
    description,
    category,
    suggestedPrice,
  };
}

function fallbackHeuristicMatches(wantedItem: any, candidateListings: any[]) {
  const wantedText = `${wantedItem.title || ""} ${wantedItem.description || ""} ${wantedItem.category || ""}`.toLowerCase();
  const wantedTokens = wantedText.split(/\W+/).filter((t: string) => t.length > 2);
  const wantedBudget = typeof wantedItem.budget === "number" ? wantedItem.budget : 0;

  return candidateListings.map((l) => {
    let score = 35;
    if (wantedItem.category && l.category && wantedItem.category.toLowerCase() === l.category.toLowerCase()) {
      score += 35;
    }

    const listingText = `${l.title || ""} ${l.description || ""}`.toLowerCase();
    let commonKeywords = 0;
    for (const token of wantedTokens) {
      if (listingText.includes(token)) {
        commonKeywords += 1;
      }
    }
    score += Math.min(25, commonKeywords * 10);

    if (wantedBudget > 0 && l.price <= wantedBudget) {
      score += 10;
    }

    score = Math.min(95, Math.max(30, score));
    const recommendation = score >= 75 ? "connect" : score >= 50 ? "maybe" : "pass";
    const explanation = score >= 50
      ? `Matches ${l.category || "item"} criteria and budget for campus exchange.`
      : `Partial similarity with ${l.title}.`;

    return {
      listingId: l.id,
      matchScore: score,
      explanation,
      recommendation,
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
}

function fallbackHeuristicDealCheck(item: { title: string; category: string; price: number; description: string }) {
  const { category, price } = item;
  let benchmark = 500;
  if (category === "Electronics") benchmark = 2500;
  else if (category === "Textbooks") benchmark = 450;
  else if (category === "Services") benchmark = 350;
  else if (category === "Opportunities") benchmark = 0;
  else if (category === "Dorm Essentials") benchmark = 600;

  let verdict: "Great Deal" | "Fair Price" | "Overpriced" = "Fair Price";
  let estimatedValue = price;

  if (price === 0) {
    verdict = "Great Deal";
    estimatedValue = benchmark;
  } else if (price <= benchmark * 0.75) {
    verdict = "Great Deal";
    estimatedValue = Math.max(price, Math.round(benchmark * 0.9));
  } else if (price <= benchmark * 1.3) {
    verdict = "Fair Price";
    estimatedValue = Math.round(price * 0.95);
  } else {
    verdict = "Overpriced";
    estimatedValue = Math.round(benchmark * 1.1);
  }

  const explanation = verdict === "Great Deal"
    ? `Priced below average second-hand campus rates for ${category}. Great value for students.`
    : verdict === "Fair Price"
    ? `Reasonable pricing considering typical student budget and condition for ${category}.`
    : `Slightly above typical second-hand rates for ${category} on campus. Consider negotiating.`;

  return {
    verdict,
    estimatedValue,
    explanation,
  };
}

function fallbackHeuristicCampusBot(messages: Array<{ role: string; content: string }>, listings?: any[]) {
  const lastUserMsg = messages.slice().reverse().find((m) => m.role === "user")?.content?.toLowerCase() || "";

  if (Array.isArray(listings) && listings.length > 0) {
    const activeListings = listings.filter((l: any) => l && l.status !== "COMPLETED");
    const keywords = ["calculator", "textbook", "book", "laptop", "phone", "matress", "kettle", "chair", "lamp", "earbuds", "notes", "tutor", "service", "dorm", "hostel", "cycle", "cycles", "bike", "scooter", "fridge", "cooler", "fan", "pillow", "bed", "table", "monitor", "charger", "mouse", "keyboard", "headphones", "ipad", "tablet", "watch", "camera", "induction", "cooker"];
    const userMentionedKeywords = keywords.filter(kw => lastUserMsg.includes(kw));
    const searchTerms = lastUserMsg.split(/\W+/).filter(t => t.length > 2 && !["there", "have", "want", "need", "like", "find", "some", "with", "from", "srmist", "campus", "available"].includes(t));

    const matchedListings = activeListings.filter((l: any) => {
      const title = String(l.title || "").toLowerCase();
      const desc = String(l.description || "").toLowerCase();
      const cat = String(l.category || "").toLowerCase();
      
      if (userMentionedKeywords.some(kw => title.includes(kw) || desc.includes(kw) || cat.includes(kw))) {
        return true;
      }
      if (searchTerms.some(term => title.includes(term) || desc.includes(term))) {
        return true;
      }
      return false;
    });

    if (matchedListings.length > 0) {
      let response = `Yes! I found the following available campus products/listings that match or are conceptually similar to what you mentioned:\n\n`;
      matchedListings.forEach((l) => {
        response += `• **${l.title}**\n  * Price: **₹${l.price}**\n  * Category: *${l.category}*\n  * Owner: ${l.ownerName || "Student"}\n  * Description: ${l.description || 'No description'}\n\n`;
      });
      response += `To get in touch, go to the Marketplace, find the listing card, and click **Contact Seller** to email them directly!`;
      return response;
    } else if (userMentionedKeywords.length > 0 || lastUserMsg.includes("is there") || lastUserMsg.includes("do you have") || lastUserMsg.includes("any")) {
      return `I checked the live marketplace for any available items matching your request, but unfortunately, there are no live listings for that at the moment.\n\nI highly recommend posting a request on the **Wanted Board**! This way, other SRMIST students can see exactly what you need and offer it to you directly.`;
    }
  }

  if (lastUserMsg.includes("safety") || lastUserMsg.includes("meet") || lastUserMsg.includes("where")) {
    return "For safe exchanges at SRMIST, always meet during daylight in public, well-lit campus spots like Tech Park, Central Library entrance, or Java Green cafeteria. Never transfer money in advance before inspecting the item in person.";
  }
  if (lastUserMsg.includes("verify") || lastUserMsg.includes("verification") || lastUserMsg.includes("badge")) {
    return "SRM student verification is granted when you sign in with your official university email (@srmist.edu.in). Verified badges appear on your profile and listings to build trust across the student community.";
  }
  if (lastUserMsg.includes("prohibit") || lastUserMsg.includes("forbidden") || lastUserMsg.includes("not allowed") || lastUserMsg.includes("rule")) {
    return "Prohibited items on Share include hazardous materials, academic dishonesty materials (like exam answer keys or paid exam-taking), counterfeit goods, weapons, alcohol, and illicit substances. Respect campus community guidelines at all times.";
  }
  if (lastUserMsg.includes("fee") || lastUserMsg.includes("brokerage") || lastUserMsg.includes("charge") || lastUserMsg.includes("cost")) {
    return "Share is 100% free with zero platform fees or brokerage. Students negotiate directly and settle payments in person via cash or UPI during item handoff.";
  }

  return "Welcome to Share SRMIST! You can buy, sell, or request textbooks, electronics, dorm essentials, and academic services directly from fellow students. Let me know if you have any questions about safety, listings, or verification!";
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "5mb" }));

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // 1. AI Listing Generation Endpoint
  app.post("/api/ai/listing", async (req, res) => {
    try {
      const { prompt } = req.body || {};

      if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const cacheKey = `listing:${prompt.trim().toLowerCase()}`;
      const cached = getFromCache(cacheKey);
      if (cached) {
        return res.status(200).json(cached);
      }

      const ai = getGenAI();
      if (!ai) {
        return res.status(200).json(fallbackHeuristicListing(prompt));
      }

      try {
        const response = await generateWithFallback(
          ai,
          prompt.trim(),
          {
            systemInstruction: `You are an AI Listing Assistant for Campus Exchange, a college student marketplace. Analyze the user's brief item notes or image description and return a polished, structured JSON object.
Rules:
- Write a catchy, concise title (max 50 characters).
- Write a helpful description highlighting value for a college student.
- Categorize strictly into one of: ['Textbooks', 'Electronics', 'Services', 'Opportunities', 'Dorm Essentials'].
- Estimate a fair market price in INR as a plain number (no currency symbol) based on typical student budgets.
Respond strictly in valid JSON with keys: title (string), description (string), category (string), suggestedPrice (number).`,
            responseMimeType: "application/json",
            maxOutputTokens: 250,
            temperature: 0.2,
          },
          5000
        );

        const rawText = response.text || "{}";
        const cleaned = cleanJsonString(rawText);
        const parsed = JSON.parse(cleaned);

        const result: {
          title: string;
          description: string;
          category?: string;
          suggestedPrice: number;
        } = {
          title:
            typeof parsed.title === "string"
              ? parsed.title.trim().slice(0, 50)
              : "",
          description:
            typeof parsed.description === "string"
              ? parsed.description.trim()
              : "",
          suggestedPrice:
            typeof parsed.suggestedPrice === "number"
              ? parsed.suggestedPrice
              : typeof parsed.price === "number"
              ? parsed.price
              : parseFloat(parsed.suggestedPrice || parsed.price) || 0,
        };

        if (
          typeof parsed.category === "string" &&
          VALID_CATEGORIES.includes(parsed.category.trim() as any)
        ) {
          result.category = parsed.category.trim();
        }

        if (result.title && result.description) {
          setInCache(cacheKey, result, 15 * 60 * 1000);
          return res.status(200).json(result);
        }
      } catch (genErr) {
        console.warn("Gemini generation failed for listing, using fallback:", genErr);
      }

      const heuristic = fallbackHeuristicListing(prompt);
      setInCache(cacheKey, heuristic, 5 * 60 * 1000);
      return res.status(200).json(heuristic);
    } catch (error: any) {
      console.error("Error generating AI listing:", error);
      const fallbackPrompt = (req.body?.prompt || "").toString();
      return res.status(200).json(fallbackHeuristicListing(fallbackPrompt || "Used textbook"));
    }
  });

  // 2. AI Semantic Search Endpoint
  app.post("/api/ai/search", async (req, res) => {
    try {
      const { query } = req.body || {};

      if (!query || typeof query !== "string" || !query.trim()) {
        return res.status(200).json({
          searchTerms: [],
          category: null,
          maxBudget: null,
        });
      }

      const cacheKey = `search:${query.trim().toLowerCase()}`;
      const cached = getFromCache(cacheKey);
      if (cached) {
        return res.status(200).json(cached);
      }

      const ai = getGenAI();
      if (!ai) {
        const fallback = {
          searchTerms: query.trim().split(/\s+/).filter(Boolean),
          category: null,
          maxBudget: null,
        };
        return res.status(200).json(fallback);
      }

      try {
        const response = await generateWithFallback(
          ai,
          query.trim(),
          {
            systemInstruction: `You are the search intent engine for Share, a college student marketplace. Analyze natural language search queries from students and extract structured search parameters.
Rules:
- Extract key search terms.
- Detect category if implied from: ['Textbooks', 'Electronics', 'Services', 'Opportunities', 'Dorm Essentials']. Return null if unspecified.
- Detect maximum budget if mentioned (e.g. 'under 800', 'cheap'). Return null if unspecified.
Respond strictly in valid JSON with keys: searchTerms (array of strings), category (string or null), maxBudget (number or null).`,
            responseMimeType: "application/json",
            maxOutputTokens: 200,
            temperature: 0.1,
          },
          4500
        );

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

        const result = {
          searchTerms,
          category,
          maxBudget,
        };

        setInCache(cacheKey, result, 15 * 60 * 1000);
        return res.status(200).json(result);
      } catch (genErr) {
        console.warn("Gemini semantic search failed, falling back to keywords:", genErr);
      }

      const fallbackQuery = (req.body?.query || "").toString().trim();
      const fallbackResult = {
        searchTerms: fallbackQuery ? fallbackQuery.split(/\s+/).filter(Boolean) : [],
        category: null,
        maxBudget: null,
      };
      setInCache(cacheKey, fallbackResult, 5 * 60 * 1000);
      return res.status(200).json(fallbackResult);
    } catch (error: any) {
      console.error("Error in AI semantic search:", error);
      const fallbackQuery = (req.body?.query || "").toString().trim();
      return res.status(200).json({
        searchTerms: fallbackQuery ? fallbackQuery.split(/\s+/).filter(Boolean) : [],
        category: null,
        maxBudget: null,
        error: error?.message,
      });
    }
  });

  // 3. AI Matching Engine Endpoint
  app.post("/api/ai/match", async (req, res) => {
    try {
      const { wantedItem, availableListings } = req.body || {};

      if (!wantedItem || typeof wantedItem !== "object") {
        return res.status(400).json({ error: "wantedItem is required" });
      }

      if (!Array.isArray(availableListings) || availableListings.length === 0) {
        return res.status(200).json({ matches: [] });
      }

      // Filter to only valid listings and cap to 8 for speed
      const candidateListings = availableListings
        .filter((l: any) => l && typeof l.id === "string" && l.status !== "COMPLETED")
        .slice(0, 8)
        .map((l: any) => ({
          id: l.id,
          title: l.title || "",
          description: l.description || "",
          category: l.category || "",
          price: l.price ?? 0,
        }));

      if (candidateListings.length === 0) {
        return res.status(200).json({ matches: [] });
      }

      const ai = getGenAI();
      if (!ai) {
        return res.status(200).json({ matches: fallbackHeuristicMatches(wantedItem, candidateListings) });
      }

      try {
        const promptPayload = {
          wantedRequest: {
            title: wantedItem.title || "",
            description: wantedItem.description || "",
            category: wantedItem.category || "",
            budget: wantedItem.budget ?? 0,
          },
          candidateListings,
        };

        const response = await generateWithFallback(
          ai,
          JSON.stringify(promptPayload),
          {
            systemInstruction: `You are the AI Matching Engine for Share. Compare a student's 'Wanted Request' against an array of available marketplace listings.
Evaluate conceptual relevance, budget compatibility, and utility.
For each candidate listing, assign a matchScore (0-100), write a concise 1-sentence explanation of why it fits, and give a recommendation ('connect' | 'maybe' | 'pass').
Respond strictly in valid JSON with key 'matches', an array of objects: [{ listingId: string, matchScore: number, explanation: string, recommendation: string }].`,
            responseMimeType: "application/json",
            maxOutputTokens: 1200,
            temperature: 0.1,
          },
          6000
        );

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

        // Sort descending by matchScore
        validatedMatches.sort((a: any, b: any) => b.matchScore - a.matchScore);

        return res.status(200).json({ matches: validatedMatches });
      } catch (genErr) {
        console.warn("Gemini generation failed for match engine, using heuristic match:", genErr);
        return res.status(200).json({ matches: fallbackHeuristicMatches(wantedItem, candidateListings) });
      }
    } catch (error: any) {
      console.error("Error in AI matching engine:", error);
      const fallbackWanted = req.body?.wantedItem || {};
      const fallbackListings = Array.isArray(req.body?.availableListings) ? req.body.availableListings : [];
      return res.status(200).json({ matches: fallbackHeuristicMatches(fallbackWanted, fallbackListings) });
    }
  });

  // 4. Campus Assistant (Campus Bot) 24/7 AI Endpoint
  app.post("/api/ai/assistant", async (req, res) => {
    try {
      // 1. Authentication Check (Require existing Share authentication)
      const authHeader = req.headers.authorization || req.headers.Authorization;
      const userIdHeader = req.headers["x-user-id"];

      let userId: string | null = null;
      if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7).trim();
        if (token.length > 0) {
          userId = token;
        }
      } else if (typeof userIdHeader === "string" && userIdHeader.trim().length > 0) {
        userId = userIdHeader.trim();
      }

      if (!userId) {
        return res.status(401).json({
          error:
            "Unauthorized: You must be signed in with your college account to talk with Campus Bot.",
        });
      }

      // 2. Server-side Rate Limiting Check (~10 requests/min per user)
      const isAllowed = checkAssistantRateLimit(userId);
      if (!isAllowed) {
        return res.status(429).json({
          error:
            "Rate limit exceeded: You can send up to 10 messages per minute to Campus Bot. Please wait a moment before trying again.",
        });
      }

      // 3. Request Body Zod Validation
      const validationResult = AssistantRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        const errorMessage =
          validationResult.error.issues[0]?.message || "Invalid request format.";
        return res.status(400).json({ error: errorMessage });
      }

      const { messages, listings, wanted } = validationResult.data;

      // Check total character size across all messages
      const totalLength = messages.reduce((sum, m) => sum + m.content.length, 0);
      if (totalLength > 25000) {
        return res
          .status(400)
          .json({ error: "Conversation payload exceeds safe size limits." });
      }

      // 4. Verify API Key & attempt Gemini generation
      const ai = getGenAI();
      if (!ai) {
        return res.status(200).json({ response: fallbackHeuristicCampusBot(messages, listings) });
      }

      let queryTerms: string[] = [];
      let filteredListings: any[] = [];
      let filteredWanted: any[] = [];
      let isAskingForItems: RegExpMatchArray | null = null;

      try {
        // Multi-turn Conversation Context (Format properly for Gemini: must start with user, alternating turns)
        const recentMessages = messages.slice(-8);
        const geminiContents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

        for (const m of recentMessages) {
          const role = m.role === "assistant" ? "model" : "user";
          // Gemini multi-turn conversation cannot start with 'model'
          if (geminiContents.length === 0 && role === "model") {
            continue;
          }
          // Merge consecutive messages with the same role
          if (
            geminiContents.length > 0 &&
            geminiContents[geminiContents.length - 1].role === role
          ) {
            geminiContents[geminiContents.length - 1].parts[0].text += `\n\n${m.content}`;
          } else {
            geminiContents.push({
              role,
              parts: [{ text: m.content }],
            });
          }
        }

        // If empty (e.g. only initial greeting), pick the last user message or fallback
        if (geminiContents.length === 0) {
          const lastUserMsg = messages.slice().reverse().find((m) => m.role === "user");
          if (lastUserMsg) {
            geminiContents.push({
              role: "user",
              parts: [{ text: lastUserMsg.content }],
            });
          } else {
            geminiContents.push({
              role: "user",
              parts: [{ text: "Hello Campus Bot" }],
            });
          }
        }

        // Fetch live product and request snapshot
        const snapshot = await fetchLiveProductsSnapshot(listings, wanted);
        
        // Get last user query to perform strict programmatic pre-filtering of lists
        const lastUserMsgText = messages.slice().reverse().find((m) => m.role === "user")?.content || "";
        
        // Normalize and extract keywords (length >= 3, excluding common stopwords/filler words)
        queryTerms = lastUserMsgText.toLowerCase()
          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, " ")
          .split(/\s+/)
          .filter(term => term.length >= 3 && !["the", "and", "for", "you", "have", "any", "are", "what", "now", "right", "this", "that", "with", "from", "how", "can", "get", "who", "there", "out", "buy", "sell", "looking", "want", "need", "offering", "available", "please", "show", "list", "find", "some", "someone", "anyone", "about", "your", "here", "item", "items", "product", "products", "exchange", "platform", "srmist", "campus"].includes(term));

        filteredListings = snapshot.listings;
        filteredWanted = snapshot.wanted;

        // Strict trigger to filter items if the user is asking about specific objects or categories
        isAskingForItems = lastUserMsgText.toLowerCase().match(/(have|any|search|find|buy|sell|look|get|where|is there|textbook|book|cycle|bicycle|bike|fridge|refrigerator|kettle|tutor|lesson|class|study|chair|lamp|soldering|arduino|sensors|opportunities|services|essentials)/i);

        if (isAskingForItems && queryTerms.length > 0) {
          filteredListings = snapshot.listings.filter(item => {
            const titleLower = item.title.toLowerCase();
            const catLower = item.category.toLowerCase();
            return queryTerms.some(term => {
              // Exact physical product checks
              if (term === "cycle" || term === "bicycle" || term === "bike") {
                return titleLower.includes("cycle") || titleLower.includes("bicycle") || titleLower.includes("bike");
              }
              if (term === "book" || term === "textbook" || term === "books" || term === "textbooks") {
                return catLower.includes("textbook") || titleLower.includes("book") || titleLower.includes("textbook");
              }
              if (term === "fridge" || term === "refrigerator" || term === "fridges" || term === "refrigerators") {
                return titleLower.includes("fridge") || titleLower.includes("refrigerator");
              }
              if (term === "chair" || term === "desk") {
                return titleLower.includes("chair") || titleLower.includes("desk");
              }
              if (term === "kettle") {
                return titleLower.includes("kettle");
              }
              // Normal match against actual title
              return titleLower.includes(term);
            });
          });

          filteredWanted = snapshot.wanted.filter(item => {
            const titleLower = item.title.toLowerCase();
            const catLower = item.category.toLowerCase();
            return queryTerms.some(term => {
              // Exact physical product checks
              if (term === "cycle" || term === "bicycle" || term === "bike") {
                return titleLower.includes("cycle") || titleLower.includes("bicycle") || titleLower.includes("bike");
              }
              if (term === "book" || term === "textbook" || term === "books" || term === "textbooks") {
                return catLower.includes("textbook") || titleLower.includes("book") || titleLower.includes("textbook");
              }
              if (term === "fridge" || term === "refrigerator" || term === "fridges" || term === "refrigerators") {
                return titleLower.includes("fridge") || titleLower.includes("refrigerator");
              }
              if (term === "chair" || term === "desk") {
                return titleLower.includes("chair") || titleLower.includes("desk");
              }
              if (term === "kettle") {
                return titleLower.includes("kettle");
              }
              // Normal match against actual title
              return titleLower.includes(term);
            });
          });
        }

        let compactContext = "";
        
        compactContext += "\nCURRENT LIVE LISTINGS:\n";
        if (filteredListings.length > 0) {
          filteredListings.forEach((item) => {
            compactContext += `- [Category: ${item.category}] "${item.title}" - Price: ₹${item.priceOrBudget} (Status: ${item.status})\n`;
          });
        } else {
          compactContext += "(No matching live listings currently available)\n";
        }
        
        compactContext += "\nCURRENT LIVE WANTED REQUESTS:\n";
        if (filteredWanted.length > 0) {
          filteredWanted.forEach((item) => {
            compactContext += `- [Category: ${item.category}] "${item.title}" - Budget: ₹${item.priceOrBudget} (Status: ${item.status})\n`;
          });
        } else {
          compactContext += "(No matching live wanted requests currently available)\n";
        }

        const systemInstruction = `You are Campus Bot, the official 24/7 AI Assistant for the Share campus exchange platform.
Your purpose is to help students safely and effectively use the Share campus exchange platform.
Use the supplied Share knowledge context as the authoritative source for Share-specific information.
Never invent Share-specific policies, features, fees, privacy practices, verification requirements, or safety requirements.

CRITICAL PRIVACY & GROUNDING RULES:
1. NEVER share or invent any specific student's contact details, phone numbers, email addresses, hostel room numbers, or real-life coordinates in your responses. All student communications are handled directly by clicking the secure "Contact" or "Offer" buttons on the listings and wanted cards in the UI. Instruct the user to click those UI buttons to contact owners.
2. NEVER claim that you do not have access to listings or cannot look up active marketplace items. You have full visibility!
3. STRICT SPECIFICITY IN PRODUCT MATCHING (ANTI-OVERGENERALIZATION - MANDATORY):
   - You MUST ONLY list items whose actual TITLE or DESCRIPTION directly corresponds to the specific physical product, book, or service the user is asking about (e.g., if searching for "bicycle", ONLY return actual bicycles/cycles).
   - NEVER list an item simply because it shares the same category name as the matched item (e.g., do NOT list study chairs, kettles, or refrigerators when the user is asking for a bicycle, even if they are both under the "Dorm Essentials" category).
   - Under no circumstances should you list "similar items in the same category" unless those items are also direct matches for the requested product.
   - If a user asks for a product, and there are NO specific matches in the provided data list, do NOT return any listings at all. Instead, say: "I don't see any active listings or wanted requests for that specific item right now. You can check back later or post a Wanted request on the Wanted Board."
   - Follow these rules strictly, with absolutely NO exceptions.

EXAMPLES OF CORRECT SPECIFIC MATCHING:
- User asks: "What textbooks are available?"
  * Correct matches to list: CLRS 4th Ed., Signals and Systems, Principles of Marketing, Engineering Mechanics, Core Java.
  * Incorrect matches to ignore: Arduino Starter Kit (Electronics), Soldering Station (Electronics).
- User asks: "Is anyone selling a bicycle?" or "Do you have any bikes?"
  * Correct matches to list: "Looking for Used Geared Bicycle / Hybrid Cycle (Hercules/Btwin)" (wanted request).
  * Incorrect matches to ignore: "Ergonomic Mesh Study Chair", "Pigeon Electric Kettle", "Haier 50L Energy-Saver Dorm Mini Refrigerator" (these are Dorm Essentials, but they are NOT bicycles! DO NOT list them).
- User asks: "Do you have any refrigerators?"
  * Correct matches to list: "Haier 50L Energy-Saver Dorm Mini Refrigerator" (listing).
  * Incorrect matches to ignore: "USHA Room Cooler", "Prestige Induction Cooktop" (these are Dorm Essentials, but NOT refrigerators! DO NOT list them).

Tone: Friendly, concise, helpful, student-friendly. Keep ordinary answers around 3-4 sentences.

AUTHORITATIVE SHARE KNOWLEDGE BASE:
${CAMPUS_KNOWLEDGE}

${compactContext}
`;

        const response = await generateWithFallback(
          ai,
          geminiContents,
          {
            systemInstruction,
            maxOutputTokens: 300,
            temperature: 0.3,
          },
          6000
        );

        const textResponse = response.text?.trim();
        if (textResponse) {
          return res.status(200).json({
            response: textResponse,
            debugInfo: {
              extractedKeywords: queryTerms,
              matchedListingsCount: filteredListings.length,
              matchedWantedRequestsCount: filteredWanted.length,
              activeFilters: {
                isAskingForItems: !!isAskingForItems,
              }
            }
          });
        }
      } catch (genErr) {
        console.warn("Campus bot Gemini call failed, falling back to grounded knowledge:", genErr);
      }

      return res.status(200).json({
        response: fallbackHeuristicCampusBot(messages, listings),
        debugInfo: {
          extractedKeywords: queryTerms,
          matchedListingsCount: filteredListings.length,
          matchedWantedRequestsCount: filteredWanted.length,
          activeFilters: {
            isAskingForItems: !!isAskingForItems,
          }
        }
      });
    } catch (error: any) {
      console.error("Error in Campus Bot assistant endpoint:", error);
      const fallbackMsgs = Array.isArray(req.body?.messages) ? req.body.messages : [];
      const fallbackListings = Array.isArray(req.body?.listings) ? req.body.listings : [];
      return res.status(200).json({
        response: fallbackHeuristicCampusBot(fallbackMsgs, fallbackListings),
        debugInfo: {
          extractedKeywords: [],
          matchedListingsCount: 0,
          matchedWantedRequestsCount: 0,
          activeFilters: {
            isAskingForItems: false,
          }
        }
      });
    }
  });

  // 5. AI Deal Checker Endpoint
  app.post("/api/ai/deal-check", async (req, res) => {
    try {
      // 1. Authentication Check (Require existing Share authentication)
      const authHeader = req.headers.authorization || req.headers.Authorization;
      const userIdHeader = req.headers["x-user-id"];

      let userId: string | null = null;
      if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7).trim();
        if (token.length > 0) {
          userId = token;
        }
      } else if (typeof userIdHeader === "string" && userIdHeader.trim().length > 0) {
        userId = userIdHeader.trim();
      }

      if (!userId) {
        return res.status(401).json({
          error:
            "Unauthorized: You must be signed in with your college account to check deal prices.",
        });
      }

      // 2. Server-side Rate Limiting Check (~10 requests/min per user)
      const isAllowed = checkDealCheckRateLimit(userId);
      if (!isAllowed) {
        return res.status(429).json({
          error:
            "Rate limit exceeded: You can perform up to 10 deal checks per minute. Please wait a moment before trying again.",
        });
      }

      // 3. Request Body Zod Validation
      const validationResult = DealCheckRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        const errorMessage =
          validationResult.error.issues[0]?.message || "Invalid request format.";
        return res.status(400).json({ error: errorMessage });
      }

      const { title, category, price, description } = validationResult.data;

      const cacheKey = `deal:${title.toLowerCase().trim()}:${category}:${price}`;
      const cached = getFromCache(cacheKey);
      if (cached) {
        return res.status(200).json(cached);
      }

      // 4. Verify API Key
      const ai = getGenAI();
      if (!ai) {
        const fallback = fallbackHeuristicDealCheck({ title, category, price, description });
        setInCache(cacheKey, fallback, 10 * 60 * 1000);
        return res.status(200).json(fallback);
      }

      try {
        const promptPayload = {
          title,
          category,
          price,
          description,
        };

        const systemInstruction = `You are the AI Price Evaluator for Share, a college marketplace.
Evaluate whether a listed item appears fairly priced for a college student and second-hand marketplace context.
Classify the price into exactly one verdict: 'Great Deal' | 'Fair Price' | 'Overpriced'.
Estimate a reasonable second-hand/student-market value in INR. Provide one concise sentence explaining the assessment.
Return only valid JSON matching schema: { "verdict": "Great Deal"|"Fair Price"|"Overpriced", "estimatedValue": number, "explanation": string }.`;

        const response = await generateWithFallback(
          ai,
          JSON.stringify(promptPayload),
          {
            systemInstruction,
            responseMimeType: "application/json",
            maxOutputTokens: 180,
            temperature: 0.1,
          },
          5000
        );

        const rawText = response.text || "{}";
        const cleaned = cleanJsonString(rawText);
        const parsed = JSON.parse(cleaned);

        if (typeof parsed.estimatedValue === "string") {
          parsed.estimatedValue =
            parseFloat(parsed.estimatedValue.replace(/[^0-9.]/g, "")) || 0;
        }

        const aiValidationResult = DealCheckResponseSchema.safeParse(parsed);
        if (aiValidationResult.success) {
          setInCache(cacheKey, aiValidationResult.data, 20 * 60 * 1000);
          return res.status(200).json(aiValidationResult.data);
        }
      } catch (genErr) {
        console.warn("Deal check Gemini generation failed, using benchmark deal evaluator:", genErr);
      }

      const heuristic = fallbackHeuristicDealCheck({ title, category, price, description });
      setInCache(cacheKey, heuristic, 10 * 60 * 1000);
      return res.status(200).json(heuristic);
    } catch (error: any) {
      console.error("Unhandled error in deal-check route:", error);
      const fallbackItem = {
        title: req.body?.title || "Item",
        category: req.body?.category || "Textbooks",
        price: Number(req.body?.price) || 0,
        description: req.body?.description || "",
      };
      return res.status(200).json(fallbackHeuristicDealCheck(fallbackItem));
    }
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
